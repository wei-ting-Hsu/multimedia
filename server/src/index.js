import express from 'express';
import cors from 'cors';

import { serverConfig } from './config.js';
import { createAutomatedForm } from './services/createAutomatedForm.js';

const app = express();

if (serverConfig.allowedOrigins.length > 0) {
  app.use(cors({ origin: serverConfig.allowedOrigins }));
} else {
  app.use(cors());
}

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/forms', async (req, res) => {
  try {
    const { activityName, sessions, emailTemplate } = req.body;

    if (!activityName || !Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields. Please provide activityName and at least one session.'
      });
    }

    const result = await createAutomatedForm({
      activityName,
      sessions,
      emailTemplate
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Failed to create automated form. See server logs for more details.'
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const server = app.listen(serverConfig.port, () => {
  console.log(`Server listening on port ${serverConfig.port}`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
