import express from 'express';
import bodyParser from 'body-parser';
import { initializeDataSource } from './data-source';
import authRouter from './auth/auth.controller';

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  await initializeDataSource();
  const app = express();
  app.use(bodyParser.json());

  // Mount auth routes (legacy express router retained for backward compatibility). If null, skip.
  if (authRouter) {
    app.use('/auth', authRouter as any);
  }

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.listen(PORT, () => {
    console.log(`ZETS API (Sprint 1 scaffold) listening on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap API:', err);
  process.exit(1);
});
