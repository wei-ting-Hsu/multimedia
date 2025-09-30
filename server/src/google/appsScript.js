import { google } from 'googleapis';
import { getServiceAccountAuth } from './auth.js';
import { googleConfig } from '../config.js';

const SCRIPT_SCOPE = 'https://www.googleapis.com/auth/script.projects';

const templateContent = ({
  sessions,
  emailTemplate
}) => `const SESSIONS = ${JSON.stringify(sessions, null, 2)};
const EMAIL_SUBJECT = ${JSON.stringify(emailTemplate?.subject || '報名成功通知')};
const EMAIL_BODY = ${JSON.stringify(emailTemplate?.body || '感謝報名，我們已收到您的資料。')};

function onFormSubmit(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const values = e.values;
  const email = values[2];
  const selectedSession = values[3];

  if (!selectedSession) {
    return;
  }

  const counts = countSessions(sheet);
  const session = SESSIONS.find(item => item.name === selectedSession);
  if (session && counts[selectedSession] > session.capacity) {
    notifyFull(email, selectedSession);
    closeFormIfFull(counts);
    return;
  }

  MailApp.sendEmail({
    to: email,
    subject: EMAIL_SUBJECT,
    htmlBody: EMAIL_BODY.replace('\\n', '<br />')
  });

  updateChoices(counts);
}

function countSessions(sheet) {
  const data = sheet.getDataRange().getValues();
  const counts = {};
  data.slice(1).forEach(row => {
    const session = row[3];
    if (!session) return;
    counts[session] = (counts[session] || 0) + 1;
  });
  return counts;
}

function updateChoices(counts) {
  const form = FormApp.getActiveForm();
  const sessionItem = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE)[0];
  const choices = sessionItem.asMultipleChoiceItem().getChoices();
  const updatedChoices = choices.map(choice => {
    const session = SESSIONS.find(item => item.name === choice.getValue());
    if (!session) return choice;
    const count = counts[session.name] || 0;
    if (count >= session.capacity) {
      return null;
    }
    return choice;
  }).filter(Boolean);
  sessionItem.asMultipleChoiceItem().setChoices(updatedChoices);
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
    subject: ` + "`" + `【${'${'}sessionName${'}'}】場次已額滿` + "`" + `,
    htmlBody: '很抱歉，您選擇的場次已額滿，請選擇其他場次。'
  });
}
`;

export async function pushAppsScript({ scriptId, sessions, emailTemplate }) {
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
          source: templateContent({ sessions, emailTemplate })
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
