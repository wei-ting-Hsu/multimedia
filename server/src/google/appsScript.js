import { google } from 'googleapis';
import { getServiceAccountAuth } from './auth.js';
import { googleConfig } from '../config.js';

const SCRIPT_SCOPE = 'https://www.googleapis.com/auth/script.projects';

const templateContent = ({
  sessions,
  emailTemplate,
  activityName
}) => `const ACTIVITY_NAME = ${JSON.stringify(activityName || '')};
const SESSIONS = ${JSON.stringify(sessions, null, 2)};
const EMAIL_SUBJECT_TEMPLATE = ${JSON.stringify(emailTemplate?.subject || '報名成功通知')};
const EMAIL_BODY_TEMPLATE = ${JSON.stringify(emailTemplate?.body || '感謝報名，我們已收到您的資料。')};

function onFormSubmit(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const namedValues = e.namedValues || {};
  const participantName = getFirstValue(namedValues, '姓名');
  const email = getFirstValue(namedValues, 'Email');
  const selectedSession = getFirstValue(namedValues, '想報名的場次');

  if (!email || !selectedSession) {
    return;
  }

  const counts = countSessions(sheet);
  const session = SESSIONS.find(item => item.name === selectedSession);
  const selectedCount = counts[selectedSession] || 0;
  if (session && selectedCount > session.capacity) {
    updateChoices(counts);
    notifyFull(email, selectedSession);
    closeFormIfFull(counts);
    return;
  }

  const templateData = {
    activityName: ACTIVITY_NAME,
    name: participantName,
    session: selectedSession,
    email
  };

  const subject = renderTemplate(EMAIL_SUBJECT_TEMPLATE, templateData);
  const body = renderTemplate(EMAIL_BODY_TEMPLATE, templateData);

  MailApp.sendEmail({
    to: email,
    subject,
    htmlBody: body.replace(/\n/g, '<br />')
  });

  updateChoices(counts);
  closeFormIfFull(counts);
}

function getFirstValue(namedValues, key) {
  const value = namedValues[key];
  if (!value || !value.length) {
    return '';
  }
  return value[0];
}

function renderTemplate(template, data) {
  if (!template) {
    return '';
  }
  return Object.keys(data).reduce((output, key) => {
    const pattern = new RegExp('{{\\s*' + key + '\\s*}}', 'g');
    return output.replace(pattern, data[key] || '');
  }, template);
}

function countSessions(sheet) {
  const data = sheet.getDataRange().getValues();
  const counts = {};
  const validSessionNames = SESSIONS.map(session => session.name);
  data.slice(1).forEach(row => {
    const session = row[3];
    if (!session || validSessionNames.indexOf(session) === -1) {
      return;
    }
    counts[session] = (counts[session] || 0) + 1;
  });
  return counts;
}

function updateChoices(counts) {
  const form = FormApp.getActiveForm();
  const sessionItem = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE)[0];
  if (!sessionItem) {
    return;
  }

  const multipleChoiceItem = sessionItem.asMultipleChoiceItem();
  const choices = multipleChoiceItem.getChoices();
  const updatedChoices = choices
    .map(choice => {
      const session = SESSIONS.find(item => item.name === choice.getValue());
      if (!session) {
        return choice;
      }
      const count = counts[session.name] || 0;
      if (count >= session.capacity) {
        return null;
      }
      return choice;
    })
    .filter(Boolean);

  multipleChoiceItem.setChoices(updatedChoices);
}

function closeFormIfFull(counts) {
  const form = FormApp.getActiveForm();
  const allFull = SESSIONS.every(session => (counts[session.name] || 0) >= session.capacity);
  if (allFull) {
    form.setAcceptingResponses(false);
  }
}

function notifyFull(email, sessionName) {
  MailApp.sendEmail({
    to: email,
    subject: ACTIVITY_NAME
      ? ` + "`" + `【${'${'}ACTIVITY_NAME${'}'}】${'${'}sessionName${'}'} 場次已額滿` + "`" + `
      : ` + "`" + `【${'${'}sessionName${'}'}】場次已額滿` + "`" + `,
    htmlBody:
      '很抱歉，您選擇的場次已額滿，請選擇其他場次。' +
      (ACTIVITY_NAME ? ` + "`" + `<br /><br />活動名稱：${'${'}ACTIVITY_NAME${'}'}` + "`" + ` : '')
  });
}
`;

export async function pushAppsScript({ scriptId, sessions, emailTemplate, activityName }) {
  const auth = getServiceAccountAuth([SCRIPT_SCOPE]);
  await auth.authorize();

  const script = google.script({ version: 'v1', auth });

  await script.projects.updateContent({
    scriptId,
    requestBody: {
      files: [
        {
          name: 'Code',
          type: 'SERVER_JS',
          source: templateContent({ sessions, emailTemplate, activityName })
        }
      ]
    }
  });

  const { scriptDeploymentId } = googleConfig;
  if (scriptDeploymentId) {
    await script.projects.deployments.update({
      scriptId,
      deploymentId: scriptDeploymentId,
      requestBody: {
        deploymentConfig: {
          manifestFileName: 'appsscript',
          description: 'Auto-updated deployment',
          scriptId
        }
      }
    });
  }
}
