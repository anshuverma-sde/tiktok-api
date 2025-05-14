import {  Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { authenticate, restrictAccess, AuthRequest } from '../../../src/middlewares/auth.middleware';
import { HttpStatus, ErrorCodes } from '../../../src/constants/http.constants';
import ErrorHandler from '../../../src/utils/errorHandler.util';

jest.mock('jsonwebtoken');
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/session.model');
jest.mock('../../../src/utils/errorHandler.util');

const mockUserFindById = jest.fn();
const mockSessionFindOne = jest.fn();

jest.mock('../../../src/models/user.model', () => ({
  User: {
    findById: (...args: any[]) => mockUserFindById(...args),
  },
}));

jest.mock('../../../src/models/session.model', () => ({
  Session: {
    findOne: (...args: any[]) => mockSessionFindOne(...args),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
      cookies: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('should call next with error if no token is provided', async () => {
      mockRequest.headers = {};
      mockRequest.cookies = {};
      
      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
      expect(ErrorHandler).toHaveBeenCalledWith(
        expect.any(String),
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.TOKEN_REQUIRED
      );
    });

    it('should call next with error if token verification fails', async () => {
      mockRequest.cookies = { accessToken: 'valid-token' };
      
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
      expect(ErrorHandler).toHaveBeenCalledWith(
        expect.any(String),
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.INVALID_TOKEN
      );
    });

    it('should call next with error if token is expired', async () => {
      mockRequest.cookies = { accessToken: 'valid-token' };
      
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });
      
      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
      expect(ErrorHandler).toHaveBeenCalledWith(
        expect.any(String),
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.TOKEN_EXPIRED
      );
    });

    it('should call next with error if session is not found', async () => {
      mockRequest.cookies = { accessToken: 'valid-token' };
      
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'valid-user-id', role: 'user' });
      mockSessionFindOne.mockResolvedValue(null);
      
      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      expect(mockSessionFindOne).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    });

    it('should call next with error if session token is expired', async () => {
      mockRequest.cookies = { accessToken: 'valid-token' };
      
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'valid-user-id', role: 'user' });
      mockSessionFindOne.mockResolvedValue({
        accessTokenExpiresAt: new Date(Date.now() - 10000), 
      });
      
      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      expect(mockSessionFindOne).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    });

    it('should call next with error if user is not found', async () => {
      mockRequest.cookies = { accessToken: 'valid-token' };
      
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'valid-user-id', role: 'user' });
      mockSessionFindOne.mockResolvedValue({
        accessTokenExpiresAt: new Date(Date.now() + 10000), 
      });
      mockUserFindById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });
      
      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      expect(mockUserFindById).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    });

    it('should add user to request and call next if authentication is successful', async () => {
      mockRequest.cookies = { accessToken: 'valid-token' };
      
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        role: 'user',
        active: true
      };
      
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'valid-user-id', role: 'user' });
      mockSessionFindOne.mockResolvedValue({
        accessTokenExpiresAt: new Date(Date.now() + 10000), 
      });
      mockUserFindById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      });
      
      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('restrictAccess', () => {
    it('should call next with error if user is not authenticated', async () => {
      const middleware = restrictAccess(['admin']);
      
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    });

    it('should call next with error if user role is not allowed', async () => {
      mockRequest.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'user',
      } as any;
      
      const middleware = restrictAccess(['admin']);
      
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    });

    it('should call next with error if subscription is required but not active', async () => {
      mockRequest.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'user',
        subscription: {
          status: 'inactive',
        },
      } as any;
      
      const middleware = restrictAccess(['user'], ['premium']);
      
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    });

    it('should call next with error if plan is not allowed', async () => {
      mockRequest.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'user',
        subscription: {
          status: 'active',
          plan: {
            name: 'basic',
          },
        },
      } as any;
      
      const middleware = restrictAccess(['user'], ['premium']);
      
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    });

    it('should call next with error if resource limit is reached', async () => {
      mockRequest.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'user',
        subscription: {
          status: 'active',
          plan: {
            name: 'premium',
            resourceLimits: {
              bots: 5,
            },
          },
          resourceUsage: {
            bots: 5, 
          },
        },
      } as any;
      
      const middleware = restrictAccess(['user'], ['premium'], 'bots');
      
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    });

    it('should call next if all checks pass', async () => {
      mockRequest.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'admin',
        subscription: {
          status: 'active',
          plan: {
            name: 'premium',
            resourceLimits: {
              bots: 10,
            },
          },
          resourceUsage: {
            bots: 5,
          },
        },
      } as any;
      
      const middleware = restrictAccess(['admin'], ['premium'], 'bots');
      
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next if no roles or plans are specified', async () => {
      mockRequest.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'user',
      } as any;
      
      const middleware = restrictAccess();
      
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
}); 