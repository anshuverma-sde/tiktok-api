import ErrorHandler from '../../utils/errorHandler.util';
import { HttpStatus } from '../../constants/http.constants';

describe('ErrorHandler', () => {
  it('should create an error with the provided message and status code', () => {
    const errorMessage = 'Test error message';
    const statusCode = HttpStatus.BAD_REQUEST;
    const errorCode = 'TEST_ERROR';
    
    const error = new ErrorHandler(errorMessage, statusCode, errorCode);
    
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(errorMessage);
    expect(error.statusCode).toBe(statusCode);
    expect(error.errorCode).toBe(errorCode);
    expect(error.stack).toBeDefined();
  });
  
  it('should default to INTERNAL_SERVER_ERROR status code if not provided', () => {
    const errorMessage = 'Test error message';
    
    const error = new ErrorHandler(errorMessage);
    
    expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });
  
  it('should fall back to INTERNAL_SERVER_ERROR if invalid status code is provided', () => {
    const errorMessage = 'Test error message';
    const invalidStatusCode = 'invalid' as unknown as HttpStatus;
    
    const error = new ErrorHandler(errorMessage, invalidStatusCode);
    
    expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });
  
  it('should have undefined errorCode if not provided', () => {
    const errorMessage = 'Test error message';
    
    const error = new ErrorHandler(errorMessage);
    
    expect(error.errorCode).toBeUndefined();
  });
}); 