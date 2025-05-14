import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { formatZodError } from '../validators';
import ErrorHandler from '../utils/errorHandler.util';
import { HttpStatus, ErrorCodes } from '../constants/http.constants';

// Interface for the validation middleware function options
export interface ValidateOptions {
  source?: 'body' | 'query' | 'params';
}

// Function to create a validation middleware for a given schema
export const validateRequest = (
  schema: z.ZodType<any, any, any>,
  options: ValidateOptions = { source: 'body' }
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const source = options.source ?? 'body';
      const result = schema.safeParse(req[source]);
      
      if (!result.success) {
        const errorMessage = formatZodError(result.error);
        throw new ErrorHandler(
          errorMessage,
          HttpStatus.BAD_REQUEST,
          ErrorCodes.INVALID_INPUT
        );
      }
      
      // Assign the validated data back to the request
      req[source] = result.data;
      next();
    } catch (error) {
      if (error instanceof ErrorHandler) {
        next(error);
      } else {
        next(
          new ErrorHandler(
            'Invalid input',
            HttpStatus.BAD_REQUEST,
            ErrorCodes.INVALID_INPUT
          )
        );
      }
    }
  };
}; 