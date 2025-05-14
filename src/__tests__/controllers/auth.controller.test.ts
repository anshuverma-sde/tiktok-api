import { Request, Response, NextFunction } from 'express';
import * as AuthController from '../../controllers/auth.controller';
import { AuthService } from '../../services/auth.service';
import { ResponseHandler } from '../../utils/responseHandler.util';
import ErrorHandler from '../../utils/errorHandler.util';
import { HttpStatus, ErrorCodes, ErrorMessages, SuccessMessages } from '../../constants/http.constants';

jest.mock('../../services/auth.service');
jest.mock('../../utils/responseHandler.util');
jest.mock('../../utils/errorHandler.util', () => {
  return jest.fn().mockImplementation((message, statusCode, errorCode) => {
    return { message, statusCode, errorCode, toString: () => message };
  });
});
jest.mock('../../middlewares/transaction.middleware', () => ({
  withTransaction: jest.fn((fn) => fn),
}));

// Mock the TryCatch middleware to directly execute the function
jest.mock('../../middlewares/error.middleware', () => {
  return {
    TryCatch: jest.fn((fn) => {
      return async (...args: [Request, Response, NextFunction]) => {
        try {
          return await fn(...args);
        } catch (error) {
          args[2](error); // Call next with the error
          return undefined;
        }
      };
    }),
  };
});

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  
  beforeEach(() => {
    mockRequest = {
      body: {},
      headers: {},
      cookies: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('verifyEmail', () => {
    it('should call AuthService.verifyEmail with token and return success response', async () => {
      const mockToken = 'valid-token';
      const mockUser = { id: '123', name: 'Test User', email: 'test@example.com', isVerified: true };
      mockRequest.body = { token: mockToken };

      (AuthService.verifyEmail as jest.Mock).mockResolvedValue(mockUser);

      await AuthController.verifyEmail(mockRequest as Request, mockResponse as Response, mockNext);

      expect(AuthService.verifyEmail).toHaveBeenCalledWith(mockToken);
      expect(ResponseHandler.success).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.OK,
        { user: mockUser },
        'Email verified successfully'
      );
    });
  });

  describe('login', () => {
    it('should call AuthService.login with credentials and return tokens', async () => {
      const mockCredentials = { email: 'test@example.com', password: 'password123', rememberMe: false };
      const mockResult = {
        user: { id: '123', email: 'test@example.com' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      mockRequest.body = mockCredentials;

      (AuthService.login as jest.Mock).mockResolvedValue(mockResult);

      await AuthController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(AuthService.login).toHaveBeenCalledWith(
        mockCredentials.email,
        mockCredentials.password,
        mockCredentials.rememberMe
      );
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(ResponseHandler.success).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.OK,
        {
          user: mockResult.user,
          accessToken: mockResult.accessToken,
          refreshToken: mockResult.refreshToken,
        },
        SuccessMessages.LOGIN
      );
    });
  });

  describe('forgotPassword', () => {
    it('should call AuthService.forgotPassword with email and return success response', async () => {
      const mockEmail = 'test@example.com';
      mockRequest.body = { email: mockEmail };

      (AuthService.forgotPassword as jest.Mock).mockResolvedValue(undefined);

      await AuthController.forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(AuthService.forgotPassword).toHaveBeenCalledWith(mockEmail);
      expect(ResponseHandler.success).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.OK,
        undefined,
        'If an account exists with this email, you will receive a password reset link'
      );
    });
  });

  describe('resetPassword', () => {
    it('should call AuthService.resetPassword with token and new password', async () => {
      const mockToken = 'reset-token';
      const mockNewPassword = 'new-password123';
      mockRequest.body = { token: mockToken, newPassword: mockNewPassword };

      (AuthService.resetPassword as jest.Mock).mockResolvedValue(undefined);

      await AuthController.resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(AuthService.resetPassword).toHaveBeenCalledWith(mockToken, mockNewPassword);
      expect(ResponseHandler.success).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.OK,
        undefined,
        SuccessMessages.RESET_PASSWORD
      );
    });
  });

  describe('logout', () => {
    it('should call AuthService.logout with token and return success response', async () => {
      const mockAccessToken = 'access-token';
      mockRequest.cookies = { accessToken: mockAccessToken };

      (AuthService.logout as jest.Mock).mockResolvedValue(undefined);

      await AuthController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(AuthService.logout).toHaveBeenCalledWith(mockAccessToken);
      expect(mockResponse.clearCookie).toHaveBeenCalled();
      expect(ResponseHandler.success).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.OK,
        undefined,
        'Logged out successfully'
      );
    });

    it('should throw error if token is not provided', async () => {
      mockRequest.cookies = {}; 
      
      // Mock ErrorHandler to not throw but return a mock error object
      const mockError = {
        message: ErrorMessages.SESSION_EXPIRED,
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: ErrorCodes.SESSION_EXPIRED
      };
      
      (ErrorHandler as unknown as jest.Mock).mockReturnValue(mockError);
      
      await AuthController.logout(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(ErrorHandler).toHaveBeenCalledWith(
        ErrorMessages.SESSION_EXPIRED,
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.SESSION_EXPIRED
      );
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(AuthService.logout).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should call AuthService.refreshToken and return new tokens', async () => {
      const mockRefreshToken = 'refresh-token';
      const mockNewTokens = {
        newAccessToken: 'new-access-token',
        newRefreshToken: 'new-refresh-token',
      };
      mockRequest.cookies = { refreshToken: mockRefreshToken };

      (AuthService.refreshToken as jest.Mock).mockResolvedValue(mockNewTokens);

      await AuthController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(AuthService.refreshToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(ResponseHandler.success).toHaveBeenCalledWith(
        mockResponse,
        HttpStatus.OK,
        {
          accessToken: mockNewTokens.newAccessToken,
          refreshToken: mockNewTokens.newRefreshToken,
        },
        SuccessMessages.REFRESHED
      );
    });
  });
}); 