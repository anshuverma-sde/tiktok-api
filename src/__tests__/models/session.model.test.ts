import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import ms from 'ms';
import { Session, ISession } from '../../models/session.model';
import env from '../../config/env';

jest.mock('jsonwebtoken');
jest.mock('ms');
jest.mock('../../config/env', () => ({
  accessTokenSecret: 'test-access-secret',
  refreshTokenSecret: 'test-refresh-secret',
  accessTokenExpiresIn: '1h',
  refreshTokenExpiresIn: '7d'
}));

describe('Session Model', () => {
  let session: mongoose.Document & ISession;
  const mockUserId = new mongoose.Types.ObjectId();
  const mockRole = 'brand_owner';
  const mockAccessToken = 'mock-access-token';
  const mockRefreshToken = 'mock-refresh-token';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    (jwt.sign as jest.Mock).mockImplementation((payload, secret, options) => {
      if (secret === env.accessTokenSecret) {
        return mockAccessToken;
      } else {
        return mockRefreshToken;
      }
    });
    
    (ms as unknown as jest.Mock).mockImplementation((timeString) => {
      if (timeString === '1h') return 3600000;
      if (timeString === '7d') return 604800000; 
      return 0;
    });
    
    session = new Session({
      userId: mockUserId,
      accessToken: 'initial-access-token',
      refreshToken: 'initial-refresh-token',
      accessTokenExpiresAt: new Date(Date.now() + 3600000), 
      refreshTokenExpiresAt: new Date(Date.now() + 604800000), 
      role: mockRole
    });

    session.save = jest.fn().mockResolvedValue(session);
  });
  
  describe('generateAccessToken', () => {
    it('should generate a new access token with correct payload and options', () => {
      const token = session.generateAccessToken();
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUserId.toString(), role: mockRole },
        env.accessTokenSecret,
        { expiresIn: env.accessTokenExpiresIn }
      );
      expect(token).toBe(mockAccessToken);
    });
  });
  
  describe('generateRefreshToken', () => {
    it('should generate a new refresh token with correct payload and options', () => {
      const token = session.generateRefreshToken();
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUserId.toString(), role: mockRole },
        env.refreshTokenSecret,
        { expiresIn: env.refreshTokenExpiresIn }
      );
      expect(token).toBe(mockRefreshToken);
    });
  });
  
  describe('isAccessTokenValid', () => {
    it('should return true when access token is not expired', () => {
      session.accessTokenExpiresAt = new Date(Date.now() + 3600000);
      
      expect(session.isAccessTokenValid()).toBe(true);
    });
    
    it('should return false when access token is expired', () => {
      session.accessTokenExpiresAt = new Date(Date.now() - 3600000);
      
      expect(session.isAccessTokenValid()).toBe(false);
    });
  });
  
  describe('isRefreshTokenValid', () => {
    it('should return true when refresh token is not expired', () => {
      session.refreshTokenExpiresAt = new Date(Date.now() + 3600000);
      
      expect(session.isRefreshTokenValid()).toBe(true);
    });
    
    it('should return false when refresh token is expired', () => {
      session.refreshTokenExpiresAt = new Date(Date.now() - 3600000);
      
      expect(session.isRefreshTokenValid()).toBe(false);
    });
  });
  
  describe('refresh', () => {
    it('should generate new tokens and update expiry dates', async () => {
      const initialAccessToken = session.accessToken;
      const initialRefreshToken = session.refreshToken;
      
      const result = await session.refresh();
      
      expect(session.accessToken).toBe(mockAccessToken);
      expect(session.refreshToken).toBe(mockRefreshToken);
      expect(session.accessToken).not.toBe(initialAccessToken);
      expect(session.refreshToken).not.toBe(initialRefreshToken);
      
      expect(session.accessTokenExpiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(session.refreshTokenExpiresAt.getTime()).toBeGreaterThan(Date.now());
      
      expect(ms).toHaveBeenCalledWith(env.accessTokenExpiresIn);
      expect(ms).toHaveBeenCalledWith(env.refreshTokenExpiresIn);
      
      expect(session.save).toHaveBeenCalled();
      
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken
      });
    });
  });
}); 