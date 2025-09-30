import { createForm, linkResponseSheet } from '../google/forms.js';
import { pushAppsScript } from '../google/appsScript.js';

export async function createAutomatedForm({ activityName, sessions, emailTemplate }) {
  const sessionOptions = sessions.map(session => ({
    name: session.name,
    capacity: Number(session.capacity)
  }));

  const form = await createForm({
    title: activityName,
    sessionOptions
  });

  const { sheetId } = await linkResponseSheet({ formId: form.formId, title: activityName });

  await pushAppsScript({
    scriptId: sheetId,
    sessions: sessionOptions,
    emailTemplate,
    activityName
  });

  return {
    formId: form.formId,
    formUrl: form.responderUri,
    sheetId,
    sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`
  };
}
