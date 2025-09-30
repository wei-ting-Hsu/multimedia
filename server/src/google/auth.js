import { google } from 'googleapis';
import { googleConfig } from '../config.js';

export function getServiceAccountAuth(scopes = []) {
  const { serviceAccountEmail, serviceAccountKey } = googleConfig;
  if (!serviceAccountEmail || !serviceAccountKey) {
    throw new Error('Service account credentials are missing.');
  }

  const jwtClient = new google.auth.JWT({
    email: serviceAccountEmail,
    key: serviceAccountKey.replace(/\\n/g, '\n'),
    scopes
  });

  return jwtClient;
}

export async function getOAuth2Client(tokens) {
  const { clientId, clientSecret, redirectUri } = googleConfig;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('OAuth2 credentials are missing.');
  }

  const oauth2Client = new google.auth.OAuth2({
    clientId,
    clientSecret,
    redirectUri
  });

  if (tokens) {
    oauth2Client.setCredentials(tokens);
  }

  return oauth2Client;
}
