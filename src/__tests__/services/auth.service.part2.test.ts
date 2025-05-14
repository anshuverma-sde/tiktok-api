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
jest.mock('../../integrations/email.integration');
jest.mock('crypto');

class TokenExpiredError extends Error {
  expiredAt: Date;
  
  constructor(message: string, expiredAt: Date) {
    super(message);
    this.name = 'TokenExpiredError';
    this.expiredAt = expiredAt;
  }
}

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
  TokenExpiredError
}));

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

describe('AuthService Part 2', () => {
  const mockUser = {
    _id: 'user-id-123',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    companyName: 'Test Company',
    role: 'brand_owner',
    isEmailVerified: true,
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

  describe('forgotPassword', () => {
    it('should generate a reset token and send reset email for existing user', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      
      const resetTokenSave = jest.fn().mockResolvedValue({ token: mockToken });
      (ResetToken as unknown as jest.Mock).mockImplementation(() => ({
        token: mockToken,
        save: resetTokenSave
      }));
      
      (EmailService.sendPasswordResetEmail as jest.Mock).mockResolvedValue(true);
      
      await AuthService.forgotPassword(mockUser.email);
      
      expect(User.findOne).toHaveBeenCalledWith({ email: mockUser.email });
      expect(ResetToken).toHaveBeenCalledWith({
        userId: mockUser._id,
        token: mockToken,
        expiresAt: expect.any(Date)
      });
      expect(resetTokenSave).toHaveBeenCalled();
      expect(EmailService.sendPasswordResetEmail).toHaveBeenCalledWith(mockUser.email, mockToken);
    });

    it('should throw NOT_FOUND if user does not exist', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      await expect(AuthService.forgotPassword('nonexistent@example.com')).rejects.toThrow(
        expect.objectContaining({
          message: ErrorMessages.USER_NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND
        })
      );
      
      expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
      expect(ResetToken).not.toHaveBeenCalled();
      expect(EmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      (ResetToken.findOne as jest.Mock).mockResolvedValue({
        _id: 'reset-token-id-123',
        token: mockToken,
        userId: mockUser._id,
        expiresAt: new Date(Date.now() + 3600000)
      });
      
      const userSave = jest.fn().mockResolvedValue({ ...mockUser, password: 'new-hashed-password' });
      (User.findById as jest.Mock).mockResolvedValue({
        ...mockUser,
        save: userSave
      });
      
      (ResetToken.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      
      await AuthService.resetPassword(mockToken, 'newPassword123');
      
      expect(ResetToken.findOne).toHaveBeenCalledWith({ token: mockToken });
      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
      expect(userSave).toHaveBeenCalled();
      expect(ResetToken.deleteOne).toHaveBeenCalledWith({ _id: 'reset-token-id-123' });
    });

    it('should throw an error if token not found', async () => {
      (ResetToken.findOne as jest.Mock).mockResolvedValue(null);
      
      await expect(AuthService.resetPassword(mockToken, 'newPassword123')).rejects.toThrow(
        expect.objectContaining({
          message: ErrorMessages.INVALID_RESET_TOKEN,
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCodes.INVALID_RESET_TOKEN
        })
      );
    });

    it('should throw an error if token is expired', async () => {
      (ResetToken.findOne as jest.Mock).mockResolvedValue({
        _id: 'reset-token-id-123',
        token: mockToken,
        userId: mockUser._id,
        expiresAt: new Date(Date.now() - 3600000)
      });
      
      (ResetToken.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      
      await expect(AuthService.resetPassword(mockToken, 'newPassword123')).rejects.toThrow(
        expect.objectContaining({
          message: ErrorMessages.INVALID_RESET_TOKEN,
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCodes.INVALID_RESET_TOKEN
        })
      );
      expect(ResetToken.deleteOne).toHaveBeenCalledWith({ _id: 'reset-token-id-123' });
    });

    it('should throw an error if user not found', async () => {
      (ResetToken.findOne as jest.Mock).mockResolvedValue({
        _id: 'reset-token-id-123',
        token: mockToken,
        userId: mockUser._id,
        expiresAt: new Date(Date.now() + 3600000)
      });
      
      (User.findById as jest.Mock).mockResolvedValue(null);
      
      await expect(AuthService.resetPassword(mockToken, 'newPassword123')).rejects.toThrow(
        expect.objectContaining({
          message: ErrorMessages.USER_NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
          errorCode: ErrorCodes.USER_NOT_FOUND
        })
      );
    });
  });

  describe('logout', () => {
    it('should delete the session associated with the access token', async () => {
      (Session.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      
      await AuthService.logout(mockAccessToken);
      
      expect(Session.deleteMany).toHaveBeenCalledWith({ 
        $or: [
          { accessToken: mockAccessToken }, 
          { refreshToken: mockAccessToken }
        ]
      });
    });

    it('should not throw an error if session is not found', async () => {
      (Session.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });
      
      await AuthService.logout(mockAccessToken);
      
      expect(Session.deleteMany).toHaveBeenCalledWith({
        $or: [
          { accessToken: mockAccessToken }, 
          { refreshToken: mockAccessToken }
        ]
      });
    });
  });

  describe('refreshToken', () => {
    it('should issue new tokens when refresh token is valid', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUser._id,
        role: mockUser.role
      });
      
      (Session.findOne as jest.Mock).mockResolvedValue({
        ...mockSession,
        save: jest.fn().mockResolvedValue(mockSession)
      });
      
      const result = await AuthService.refreshToken(mockRefreshToken);
      
      expect(jwt.verify).toHaveBeenCalledWith(mockRefreshToken, env.refreshTokenSecret);
      expect(Session.findOne).toHaveBeenCalledWith({ refreshToken: mockRefreshToken });
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        newAccessToken: mockAccessToken,
        newRefreshToken: mockRefreshToken,
        isPersistent: false
      });
    });

    it('should throw an error if session is not found', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUser._id,
        role: mockUser.role
      });
      
      (Session.findOne as jest.Mock).mockResolvedValue(null);
      
      await expect(AuthService.refreshToken(mockRefreshToken)).rejects.toThrow(
        expect.objectContaining({
          message: ErrorMessages.INVALID_REFRESH_TOKEN,
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCodes.INVALID_REFRESH_TOKEN
        })
      );
    });

    it('should throw an error if refresh token is expired in the session', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUser._id,
        role: mockUser.role
      });
      
      (Session.findOne as jest.Mock).mockResolvedValue({
        ...mockSession,
        refreshTokenExpiresAt: new Date(Date.now() - 3600000)
      });
      
      (Session.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      
      await expect(AuthService.refreshToken(mockRefreshToken)).rejects.toThrow(
        expect.objectContaining({
          message: ErrorMessages.INVALID_REFRESH_TOKEN,
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCodes.INVALID_REFRESH_TOKEN
        })
      );
      expect(Session.deleteOne).toHaveBeenCalledWith({ _id: mockSession._id });
    });

    it('should handle JWT token expiration error', async () => {
      const expiredToken = new TokenExpiredError('jwt expired', new Date());
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw expiredToken;
      });

      (Session.findOne as jest.Mock).mockResolvedValue(mockSession);
      (Session.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      await expect(AuthService.refreshToken(mockRefreshToken)).rejects.toThrow(expiredToken);
      
      expect(Session.findOne).toHaveBeenCalledWith({ refreshToken: mockRefreshToken });
      expect(Session.deleteOne).toHaveBeenCalledWith({ _id: mockSession._id });
    });
  });

  describe('cleanupUnverifiedUsers', () => {
    it('should delete unverified users without active tokens', async () => {
      const unverifiedUser1 = { _id: 'user1' };
      const unverifiedUser2 = { _id: 'user2' };
      (User.find as jest.Mock).mockResolvedValue([unverifiedUser1, unverifiedUser2]);
      
      (VerificationToken.findOne as jest.Mock)
        .mockResolvedValueOnce(null) 
        .mockResolvedValueOnce({
          userId: 'user2',
          expiresAt: new Date(Date.now() + 3600000)
        });
      
      (User.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      
      await AuthService.cleanupUnverifiedUsers();
      
      expect(User.find).toHaveBeenCalledWith({ isEmailVerified: false });
      expect(VerificationToken.findOne).toHaveBeenCalledTimes(2);
      expect(User.deleteOne).toHaveBeenCalledWith({ _id: 'user1' });
      expect(User.deleteOne).not.toHaveBeenCalledWith({ _id: 'user2' });
    });

    it('should not delete any users if all have active tokens', async () => {
      const unverifiedUser = { _id: 'user1' };
      (User.find as jest.Mock).mockResolvedValue([unverifiedUser]);
      
      (VerificationToken.findOne as jest.Mock).mockResolvedValue({
        userId: 'user1',
        expiresAt: new Date(Date.now() + 3600000)
      });
      
      await AuthService.cleanupUnverifiedUsers();
      
      expect(User.find).toHaveBeenCalledWith({ isEmailVerified: false });
      expect(VerificationToken.findOne).toHaveBeenCalledWith({
        userId: 'user1',
        expiresAt: { $gt: expect.any(Date) }
      });
      expect(User.deleteOne).not.toHaveBeenCalled();
    });

    it('should handle empty array of unverified users', async () => {
      (User.find as jest.Mock).mockResolvedValue([]);
      
      await AuthService.cleanupUnverifiedUsers();
      
      expect(User.find).toHaveBeenCalledWith({ isEmailVerified: false });
      expect(VerificationToken.findOne).not.toHaveBeenCalled();
      expect(User.deleteOne).not.toHaveBeenCalled();
    });
  });
}); 