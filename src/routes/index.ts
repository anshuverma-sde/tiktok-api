import express, { Request, Response } from 'express';
import logger from '../utils/logger.util';
import env from '../config/env';
import v1Routes from './v1';

export const configureRoutes = (app: express.Application): void => {
  // Health Check Route (unversioned)
  app.get('/', (req: Request, res: Response) => {
    logger.info('Health check requested');
    res.send(
      `<h1>Site is Working. Click <a href="${env.frontendUrl}">here</a> to visit frontend.</h1>`,
    );
  });

  // Versioned Routes
  app.use('/api/v1', v1Routes);
};
