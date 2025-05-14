import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import logger from './utils/logger.util';
import { ErrorMiddleware } from './middlewares/error.middleware';
import swaggerSpec from './config/swagger.config';
import { configureMiddleware } from './config/middleware.config';
import { configureRoutes } from './routes';
import { initScheduledTasks } from './utils/scheduler.util';

const app: express.Application = express();

// Apply Middleware
configureMiddleware(app);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Apply Routes
configureRoutes(app);

// Initialize scheduled tasks
initScheduledTasks();

// Handle Invalid Routes (404)
app.use((req: Request, res: Response) => {
  logger.warn(`Invalid route accessed: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Invalid route',
  });
});

// Apply Error Handling Middleware (must be after routes)
app.use(ErrorMiddleware);

export default app;
