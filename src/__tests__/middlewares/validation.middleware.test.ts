import { Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middlewares/validation.middleware';
import ErrorHandler from '../../utils/errorHandler.util';
import { HttpStatus, ErrorCodes, ErrorMessages } from '../../constants/http.constants';
import * as validators from '../../validators';

jest.mock('../../utils/errorHandler.util');
jest.mock('../../validators', () => ({
  formatZodError: jest.fn()
}));

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
    (validators.formatZodError as jest.Mock).mockImplementation(
      (error) => error.errors?.[0]?.message || 'Validation error'
    );
  });

  describe('validateRequest', () => {
    it('should validate request body successfully', async () => {
      // Setup a schema
      const schema = z.object({
        name: z.string(),
        email: z.string().email()
      });
      
      // Valid data
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com'
      };
      
      // Create middleware
      const middleware = validateRequest(schema);
      
      // Execute
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({
        name: 'Test User',
        email: 'test@example.com'
      });
    });

    it('should validate and transform request body', async () => {
      // Setup a schema with transformation
      const schema = z.object({
        name: z.string(),
        age: z.string().transform(val => parseInt(val, 10))
      });
      
      // Data to transform
      mockRequest.body = {
        name: 'Test User',
        age: '25'
      };
      
      // Create middleware
      const middleware = validateRequest(schema);
      
      // Execute
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert - age should be transformed to number
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({
        name: 'Test User',
        age: 25
      });
    });

    it('should validate request query parameters', async () => {
      // Setup a schema
      const schema = z.object({
        search: z.string().optional(),
        page: z.string().transform(val => parseInt(val, 10)).optional()
      });
      
      // Valid query params
      mockRequest.query = {
        search: 'test',
        page: '2'
      };
      
      // Create middleware for query validation
      const middleware = validateRequest(schema, { source: 'query' });
      
      // Execute
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({
        search: 'test',
        page: 2
      });
    });

    it('should validate request URL parameters', async () => {
      // Setup a schema
      const schema = z.object({
        id: z.string().uuid()
      });
      
      // Valid params
      mockRequest.params = {
        id: '123e4567-e89b-12d3-a456-426614174000'
      };
      
      // Create middleware for params validation
      const middleware = validateRequest(schema, { source: 'params' });
      
      // Execute
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.params).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000'
      });
    });

    it('should return an error for invalid request body', async () => {
      // Setup a schema
      const schema = z.object({
        name: z.string(),
        email: z.string().email()
      });
      
      // Invalid data - missing required fields
      mockRequest.body = {
        name: 'Test User'
        // email is missing
      };
      
      // Mock formatZodError
      const errorMessage = 'Email is required';
      (validators.formatZodError as jest.Mock).mockReturnValue(errorMessage);
      
      // Create middleware
      const middleware = validateRequest(schema);
      
      // Execute
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(validators.formatZodError).toHaveBeenCalled();
      expect(ErrorHandler).toHaveBeenCalledWith(
        errorMessage,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.INVALID_INPUT
      );
      expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    });

    it('should return an error for invalid email format', async () => {
      // Setup a schema
      const schema = z.object({
        name: z.string(),
        email: z.string().email()
      });
      
      // Invalid data - email format wrong
      mockRequest.body = {
        name: 'Test User',
        email: 'invalid-email'
      };
      
      // Mock formatZodError
      const errorMessage = 'Invalid email format';
      (validators.formatZodError as jest.Mock).mockReturnValue(errorMessage);
      
      // Create middleware
      const middleware = validateRequest(schema);
      
      // Execute
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(validators.formatZodError).toHaveBeenCalled();
      expect(ErrorHandler).toHaveBeenCalledWith(
        errorMessage,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.INVALID_INPUT
      );
      expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    });

    it('should handle unexpected errors during validation', async () => {
      // Setup a schema
      const schema = z.object({
        name: z.string()
      });
      
      // Setup error
      const unexpectedError = new Error('Unexpected error');
      
      // Mock schema.safeParseAsync to throw error
      jest.spyOn(schema, 'safeParse').mockImplementation(() => {
        throw unexpectedError;
      });
      
      // Create middleware
      const middleware = validateRequest(schema);
      
      // Execute
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(ErrorHandler).toHaveBeenCalledWith(
        'Invalid input',
        HttpStatus.BAD_REQUEST,
        ErrorCodes.INVALID_INPUT
      );
      expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    });

    it('should handle ZodError thrown directly', async () => {
      // Setup a schema
      const schema = z.object({
        name: z.string()
      });
      
      // Create a ZodError
      const zodError = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['name'],
          message: 'Required'
        }
      ]);
      
      // Mock formatZodError
      const errorMessage = 'Name is required';
      (validators.formatZodError as jest.Mock).mockReturnValue(errorMessage);
      
      // Mock schema.safeParse to throw ZodError
      jest.spyOn(schema, 'safeParse').mockImplementation(() => {
        return { success: false, error: zodError };
      });
      
      // Create middleware
      const middleware = validateRequest(schema);
      
      // Execute
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(validators.formatZodError).toHaveBeenCalledWith(zodError);
      expect(ErrorHandler).toHaveBeenCalledWith(
        errorMessage,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.INVALID_INPUT
      );
      expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    });
  });
}); 