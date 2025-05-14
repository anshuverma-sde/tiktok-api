import { Request, Response, NextFunction, RequestHandler } from 'express';
import env from '../config/env';
import logger from '../utils/logger.util';
import {
  HttpStatus,
  ErrorMessages,
  ErrorCodes,
} from '../constants/http.constants';

export interface CustomError extends Error {
  statusCode?: number;
  errorCode?: string;
  message: string;
  stack?: string;
}

// Error handling middleware
export const ErrorMiddleware = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode = err.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
  const message = err.message ?? ErrorMessages.INTERNAL_SERVER_ERROR;
  const errorCode = err.errorCode ?? ErrorCodes.INTERNAL_SERVER_ERROR;

  logger.error(`${message}\nStack: ${err.stack ?? 'No stack trace'}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(errorCode && { errorCode }),
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
};

export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void | Response>;

export const TryCatch =
  (passedFunc: ControllerType): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await passedFunc(req, res, next);
    } catch (error) {
      next(error);
    }
  };
