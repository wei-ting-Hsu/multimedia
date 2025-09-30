import { google } from 'googleapis';
import { getServiceAccountAuth } from './auth.js';

const FORMS_SCOPE = 'https://www.googleapis.com/auth/forms.body';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const SPREADSHEET_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

function getFormsClient() {
  const auth = getServiceAccountAuth([FORMS_SCOPE, DRIVE_SCOPE, SPREADSHEET_SCOPE]);
  return auth.authorize().then(() => ({
    forms: google.forms({ version: 'v1', auth }),
    drive: google.drive({ version: 'v3', auth }),
    sheets: google.sheets({ version: 'v4', auth })
  }));
}

export async function createForm({ title, sessionOptions }) {
  const { forms } = await getFormsClient();

  const createResponse = await forms.forms.create({
    requestBody: {
      info: {
        title,
        documentTitle: title
      },
      items: [
        {
          title: '姓名',
          questionItem: {
            question: {
              textQuestion: { paragraph: false },
              required: true
            }
          }
        },
        {
          title: 'Email',
          questionItem: {
            question: {
              textQuestion: { paragraph: false },
              required: true
            }
          }
        },
        {
          title: '想報名的場次',
          questionItem: {
            question: {
              choiceQuestion: {
                type: 'RADIO',
                options: sessionOptions.map(option => ({ value: option.name })),
                shuffle: false
              },
              required: true
            }
          }
        }
      ]
    }
  });

  return {
    formId: createResponse.data.formId,
    responderUri: createResponse.data.responderUri,
    info: createResponse.data.info
  };
}

export async function linkResponseSheet({ formId, title }) {
  const { forms, drive } = await getFormsClient();

  const sheetResponse = await drive.files.create({
    requestBody: {
      name: `${title} 回應`,
      mimeType: 'application/vnd.google-apps.spreadsheet'
    },
    fields: 'id'
  });

  const sheetId = sheetResponse.data.id;

  await forms.forms.batchUpdate({
    formId,
    requestBody: {
      requests: [
        {
          updateSettings: {
            settings: {
              destination: {
                destinationType: 'SPREADSHEET',
                spreadsheet: { spreadsheetId: sheetId }
              }
            },
            updateMask: 'destination'
          }
        }
      ]
    }
  });

  return { sheetId };
}
