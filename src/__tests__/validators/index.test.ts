import { Request, Response } from 'express';
import { validate, formatZodError } from '../../validators';
import { z } from 'zod';
import ErrorHandler from '../../utils/errorHandler.util';
import { HttpStatus, ErrorCodes } from '../../constants/http.constants';

describe('Validators', () => {
  describe('formatZodError', () => {
    it('should format zod errors into a string message', () => {
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
      });
      
      const result = schema.safeParse({ name: 'a', email: 'invalid-email' });
      if (result.success) throw new Error('Schema validation should have failed');
      
      const formattedError = formatZodError(result.error);
      expect(formattedError).toContain('name:');
      expect(formattedError).toContain('email:');
    });
  });

  describe('validate middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: jest.Mock;

    beforeEach(() => {
      mockRequest = {
        body: {},
      };
      mockResponse = {
        json: jest.fn(),
      };
      nextFunction = jest.fn();
    });

    it('should call next() when validation succeeds', () => {
      const schema = z.object({
        name: z.string(),
      });
      
      mockRequest.body = { name: 'John Doe' };
      
      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should call next with error when validation fails', () => {
      const schema = z.object({
        name: z.string().min(3),
      });
      
      mockRequest.body = { name: 'a' };
      
      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ErrorHandler));
      const error = nextFunction.mock.calls[0][0];
      expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(error.errorCode).toBe(ErrorCodes.INVALID_INPUT);
    });

    it('should validate query parameters when source is set to query', () => {
      const schema = z.object({
        id: z.string(),
      });
      
      mockRequest.query = { id: '123' };
      
      const middleware = validate(schema, { source: 'query' });
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should handle errors that are not related to validation', () => {
      const schema = {
        safeParse: () => {
          throw new Error('Unexpected error');
        },
      } as unknown as z.ZodType;
      
      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ErrorHandler));
      const error = nextFunction.mock.calls[0][0];
      expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(error.errorCode).toBe(ErrorCodes.INVALID_INPUT);
    });

    it('should use default source (body) when not specified', () => {
      const schema = z.object({
        name: z.string(),
      });
      
      mockRequest.body = { name: 'John Doe' };
      
      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalledWith();
    });
  });
}); 