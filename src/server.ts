import app from './app';
import logger from './utils/logger.util';
import env from './config/env';
import { connectDatabase } from './config/db';

// Handling Uncaught Exception
process.on('uncaughtException', (err) => {
  logger.error(`Error: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);
  logger.error(`Shutting down the server due to Uncaught Exception`);
  process.exit(1);
});

connectDatabase(env.mongoUri, env.dbName);

const server = app.listen(env.port, () => {
  logger.info(`Server is working on http://localhost:${env.port}`);
});

// Unhandled Promise Rejection
process.on('unhandledRejection', (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack =
    reason instanceof Error
      ? (reason.stack ?? 'No stack trace')
      : 'No stack trace';

  logger.error(`Error: ${message}`);
  logger.error(`Stack: ${stack}`);
  logger.error(`Shutting down the server due to Unhandled Promise Rejection`);

  server.close(() => {
    process.exit(1);
  });
});
