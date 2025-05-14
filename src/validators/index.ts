import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import ErrorHandler from '../utils/errorHandler.util';
import { HttpStatus, ErrorCodes, ErrorMessages } from '../constants/http.constants';

// Common schema types
export const StringSchema = z.string().min(1, { message: 'Field is required' });
export const EmailSchema = z.string().email({ message: 'Invalid email format' });
export const PasswordSchema = z.string().min(8, { message: 'Password must be at least 8 characters' });
export const TokenSchema = StringSchema;

// Helper function to format Zod errors into a string message
export const formatZodError = (error: z.ZodError): string => {
  const errorDetails = error.errors.map(
    (err) => `${err.path.join('.')}: ${err.message}`
  );
  
  return errorDetails.join(', ');
};

// Interface for the validation middleware function options
export interface ValidateOptions {
  source?: 'body' | 'query' | 'params';
}

// Function to create a validation middleware for a given schema
export const validate = <T extends z.ZodType>(
  schema: T,
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
            ErrorMessages.INVALID_INPUT,
            HttpStatus.BAD_REQUEST,
            ErrorCodes.INVALID_INPUT
          )
        );
      }
    }
  };
}; 