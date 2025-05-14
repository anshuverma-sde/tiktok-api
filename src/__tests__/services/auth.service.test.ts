jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' })
  })
}));

jest.mock('../../utils/logger.util', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('../../models/user.model');
jest.mock('../../models/verification-token.model');
jest.mock('../../models/reset-token.model');
jest.mock('../../models/session.model');
jest.mock('../../models/login-attempt.model', () => ({
  LoginAttempt: {
    findOne: jest.fn().mockResolvedValue(null),
    findOneAndUpdate: jest.fn().mockResolvedValue({ attempts: 1 }),
    findOneAndDelete: jest.fn().mockResolvedValue({ deletedCount: 1 })
  }
}));
jest.mock('../../integrations/email.integration');
jest.mock('jsonwebtoken');
jest.mock('crypto');

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { VerificationToken } from '../../models/verification-token.model';
import { ResetToken } from '../../models/reset-token.model';
import { Session } from '../../models/session.model';
import { EmailService } from '../../integrations/email.integration';
import { ErrorCodes, ErrorMessages, HttpStatus } from '../../constants/http.constants';
import env from '../../config/env';

describe('AuthService', () => {
  // Mock user data
  const mockUser = {
    _id: 'user-id-123',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    companyName: 'Test Company',
    role: 'brand_owner',
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    comparePassword: jest.fn(),
    save: jest.fn()
  };

  const mockSession = {
    _id: 'session-id-123',
    userId: 'user-id-123',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    accessTokenExpiresAt: new Date(Date.now() + 3600000),
    refreshTokenExpiresAt: new Date(Date.now() + 86400000),
    role: 'brand_owner',
    save: jest.fn(),
  };

  const mockToken = 'mock-token';
  const mockAccessToken = 'access-token';
  const mockRefreshToken = 'refresh-token';

  beforeEach(() => {
    jest.clearAllMocks();
    
    (crypto.randomBytes as jest.Mock).mockReturnValue({
      toString: jest.fn().mockReturnValue(mockToken)
    });
    
    (jwt.sign as jest.Mock).mockImplementation((payload, secret, options) => {
      return secret === env.accessTokenSecret ? mockAccessToken : mockRefreshToken;
    });
    
    (jwt.decode as jest.Mock).mockImplementation((token) => {
      return { userId: 'user-id-123', role: 'brand_owner', exp: Math.floor(Date.now() / 1000) + 3600 };
    });
    
    (jwt.verify as jest.Mock).mockImplementation((token, secret) => {
      return { userId: 'user-id-123', role: 'brand_owner', exp: Math.floor(Date.now() / 1000) + 3600 };
    });
  });

  describe('signUp', () => {
    it('should create a new user and send verification email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      const userSave = jest.fn().mockResolvedValue(mockUser);
      (User as unknown as jest.Mock).mockImplementation(() => ({
        ...mockUser,
        save: userSave
      }));
      
      const tokenSave = jest.fn().mockResolvedValue({ token: mockToken });
      (VerificationToken as unknown as jest.Mock).mockImplementation(() => ({
        token: mockToken,
        save: tokenSave
      }));
      
      (EmailService.sendVerificationEmail as jest.Mock).mockResolvedValue(true);
      
      const mockDbSession = { session: 'db-session' };
      
      const result = await AuthService.signUp(
        mockUser.name,
        mockUser.email,
        'password123',
        mockUser.companyName,
        mockDbSession as unknown as mongoose.ClientSession
      );
      
      expect(User.findOne).toHaveBeenCalledWith({ email: mockUser.email });
      expect(User).toHaveBeenCalledWith({
        name: mockUser.name,
        email: mockUser.email,
        password: 'password123',
        companyName: mockUser.companyName,
        role: 'brand_owner',
        isEmailVerified: false
      });
      expect(userSave).toHaveBeenCalledWith({ session: mockDbSession });
      expect(VerificationToken).toHaveBeenCalledWith({
        userId: mockUser._id,
        token: mockToken,
        expiresAt: expect.any(Date)
      });
      expect(tokenSave).toHaveBeenCalledWith({ session: mockDbSession });
      expect(EmailService.sendVerificationEmail).toHaveBeenCalledWith(mockUser.email, mockToken);
      expect(result).toEqual({
        user: {
          _id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          companyName: mockUser.companyName,
          role: mockUser.role,
          isEmailVerified: mockUser.isEmailVerified,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt
        },
        token: mockToken
      });
    });

    it('should throw an error if email exists and is verified', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        isEmailVerified: true
      });
      
      await expect(AuthService.signUp(
        mockUser.name,
        mockUser.email,
        'password123'
      )).rejects.toThrow(expect.objectContaining({
        message: ErrorMessages.EMAIL_EXISTS,
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCodes.EMAIL_EXISTS
      }));
    });

    it('should delete unverified user if no active token exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        isEmailVerified: false,
        _id: 'user-id-123'
      });
      
      (VerificationToken.findOne as jest.Mock).mockResolvedValue(null);
      
      (User.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      
      const userSave = jest.fn().mockResolvedValue(mockUser);
      (User as unknown as jest.Mock).mockImplementation(() => ({
        ...mockUser,
        save: userSave
      }));
      
      const tokenSave = jest.fn().mockResolvedValue({ token: mockToken });
      (VerificationToken as unknown as jest.Mock).mockImplementation(() => ({
        token: mockToken,
        save: tokenSave
      }));
      
      await AuthService.signUp(
        mockUser.name,
        mockUser.email,
        'password123'
      );
      
      expect(User.deleteOne).toHaveBeenCalledWith({ _id: 'user-id-123' });
    });

    it('should throw an error if there is an active verification token', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        isEmailVerified: false
      });
      
      (VerificationToken.findOne as jest.Mock).mockResolvedValue({
        token: mockToken,
        expiresAt: new Date(Date.now() + 600000)
      });
      
      await expect(AuthService.signUp(
        mockUser.name,
        mockUser.email,
        'password123'
      )).rejects.toThrow(expect.objectContaining({
        message: ErrorMessages.VERIFICATION_EMAIL_ALREADY_SENT,
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCodes.EMAIL_EXISTS
      }));
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      (VerificationToken.findOne as jest.Mock).mockResolvedValue({
        _id: 'token-id-123',
        token: mockToken,
        userId: mockUser._id,
        expiresAt: new Date(Date.now() + 600000)
      });
      
      (User.findById as jest.Mock).mockResolvedValue({
        ...mockUser,
        save: jest.fn().mockResolvedValue({ ...mockUser, isEmailVerified: true })
      });
      
      (VerificationToken.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      
      const result = await AuthService.verifyEmail(mockToken);
      
      expect(VerificationToken.findOne).toHaveBeenCalledWith({ token: mockToken });
      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
      expect(VerificationToken.deleteOne).toHaveBeenCalledWith({ _id: 'token-id-123' });
      expect(result).toEqual({
        _id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        companyName: mockUser.companyName,
        role: mockUser.role,
        isEmailVerified: true,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      });
    });

    it('should throw an error if token not found', async () => {
      (VerificationToken.findOne as jest.Mock).mockResolvedValue(null);
      
      await expect(AuthService.verifyEmail(mockToken)).rejects.toThrow(
        expect.objectContaining({
          message: ErrorMessages.INVALID_VERIFICATION_TOKEN,
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCodes.INVALID_VERIFICATION_TOKEN
        })
      );
    });

    it('should throw an error if token is expired', async () => {
      (VerificationToken.findOne as jest.Mock).mockResolvedValue({
        _id: 'token-id-123',
        token: mockToken,
        userId: mockUser._id,
        expiresAt: new Date(Date.now() - 600000)
      });
      
      (VerificationToken.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      
      await expect(AuthService.verifyEmail(mockToken)).rejects.toThrow(
        expect.objectContaining({
          message: ErrorMessages.INVALID_VERIFICATION_TOKEN,
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCodes.INVALID_VERIFICATION_TOKEN
        })
      );
      expect(VerificationToken.deleteOne).toHaveBeenCalledWith({ _id: 'token-id-123' });
    });

    it('should throw an error if user not found', async () => {
      (VerificationToken.findOne as jest.Mock).mockResolvedValue({
        _id: 'token-id-123',
        token: mockToken,
        userId: mockUser._id,
        expiresAt: new Date(Date.now() + 600000)
      });
      
      (User.findById as jest.Mock).mockResolvedValue(null);
      
      await expect(AuthService.verifyEmail(mockToken)).rejects.toThrow(
        expect.objectContaining({
          message: ErrorMessages.USER_NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
          errorCode: ErrorCodes.USER_NOT_FOUND
        })
      );
    });
  });

  describe('login', () => {
    it('should login successfully and return tokens', async () => {
      const mockVerifiedUser = {
        ...mockUser,
        isEmailVerified: true,
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockVerifiedUser);
      
      const sessionSave = jest.fn().mockResolvedValue(mockSession);
      (Session as unknown as jest.Mock).mockImplementation(() => ({
        ...mockSession,
        save: sessionSave
      }));
      
      const result = await AuthService.login(mockUser.email, 'password123', false);
      
      expect(User.findOne).toHaveBeenCalledWith({ email: mockUser.email });
      expect(mockVerifiedUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(Session).toHaveBeenCalledWith(expect.objectContaining({
        userId: mockUser._id,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken
      }));
      expect(sessionSave).toHaveBeenCalled();
      expect(result).toEqual({
        user: {
          _id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          companyName: mockUser.companyName,
          role: mockUser.role,
          isEmailVerified: true,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt
        },
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken
      });
    }, 30000);

    it('should throw an error if user is not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      await expect(AuthService.login(mockUser.email, 'password123', false)).rejects.toThrow(
        expect.objectContaining({
          message: ErrorMessages.INVALID_EMAIL_PASSWORD,
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCodes.INVALID_EMAIL_PASSWORD
        })
      );
    }, 30000);

    it('should throw an error if email is not verified', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        isEmailVerified: false
      });
      
      await expect(AuthService.login(mockUser.email, 'password123', false)).rejects.toThrow(
        expect.objectContaining({
          message: ErrorMessages.EMAIL_NOT_VERIFIED,
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCodes.EMAIL_NOT_VERIFIED
        })
      );
    }, 30000);

    it('should throw an error if password is invalid', async () => {
      const mockVerifiedUser = {
        ...mockUser,
        isEmailVerified: true,
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockVerifiedUser);
      
      await expect(AuthService.login(mockUser.email, 'wrong-password', false)).rejects.toThrow(
        expect.objectContaining({
          message: ErrorMessages.INVALID_EMAIL_PASSWORD,
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCodes.INVALID_EMAIL_PASSWORD
        })
      );
    }, 30000);
  });

}); 