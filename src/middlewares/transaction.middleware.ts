import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ControllerType } from './error.middleware';

export type TransactionControllerType = (
  req: Request,
  res: Response,
  session: mongoose.ClientSession,
) => Promise<void | Response>;

export function withTransaction(fn: TransactionControllerType): ControllerType {
  return async function (req: Request, res: Response, _next: NextFunction) {
    let result;
    await mongoose.connection.transaction(async (session) => {
      result = await fn(req, res, session);
      return result;
    });

    return result;
  };
}
