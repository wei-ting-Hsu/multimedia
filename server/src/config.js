import dotenv from 'dotenv';

dotenv.config();

export const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
  scriptDeploymentId: process.env.GOOGLE_SCRIPT_DEPLOYMENT_ID
};

export const serverConfig = {
  port: process.env.PORT || 4000,
  allowedOrigins: (process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean)
};
