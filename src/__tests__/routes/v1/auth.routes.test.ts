import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';

const mockControllers = {
  signUp: jest.fn((req: Request, res: Response) => res.status(200).json({ success: true })),
  verifyEmail: jest.fn((req: Request, res: Response) => res.status(200).json({ success: true })),
  login: jest.fn((req: Request, res: Response) => res.status(200).json({ success: true })),
  forgotPassword: jest.fn((req: Request, res: Response) => res.status(200).json({ success: true })),
  resetPassword: jest.fn((req: Request, res: Response) => res.status(200).json({ success: true })),
  logout: jest.fn((req: Request, res: Response) => res.status(200).json({ success: true })),
  refreshToken: jest.fn((req: Request, res: Response) => res.status(200).json({ success: true }))
};

const mockAuthenticate = jest.fn((req: Request, res: Response, next: NextFunction) => next());
const mockValidateRequest = jest.fn(() => (req: Request, res: Response, next: NextFunction) => next());

jest.mock('../../../controllers/auth.controller', () => mockControllers);
jest.mock('../../../middlewares/auth.middleware', () => ({
  authenticate: mockAuthenticate
}));
jest.mock('../../../middlewares/validation.middleware', () => ({
  validateRequest: mockValidateRequest
}));
jest.mock('../../../validators/auth.validator', () => ({
  signUpSchema: {},
  loginSchema: {},
  verifyEmailSchema: {},
  forgotPasswordSchema: {},
  resetPasswordSchema: {},
  refreshTokenSchema: {}
}));

import authRoutes from '../../../routes/v1/auth.routes';

describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use('/api/v1/auth', authRoutes);
  });

  describe('POST /signup', () => {
    it('should route to signUp controller', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        companyName: 'Test Company'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData);
      
      expect(mockControllers.signUp).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('POST /verify-email', () => {
    it('should route to verifyEmail controller', async () => {
      const verificationData = {
        token: 'verification-token'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send(verificationData);
      
      expect(mockControllers.verifyEmail).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('POST /login', () => {
    it('should route to login controller', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);
      
      expect(mockControllers.login).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('POST /forgot-password', () => {
    it('should route to forgotPassword controller', async () => {
      const forgotPasswordData = {
        email: 'test@example.com'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send(forgotPasswordData);
      
      expect(mockControllers.forgotPassword).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('POST /reset-password', () => {
    it('should route to resetPassword controller', async () => {
      const resetPasswordData = {
        token: 'reset-token',
        newPassword: 'NewPassword123!'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send(resetPasswordData);
      
      expect(mockControllers.resetPassword).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('POST /logout', () => {
    it('should route to logout controller with authentication', async () => {
      // Set up the controller to handle the request
      mockControllers.logout.mockImplementation((req, res) => {
        return res.status(200).json({ success: true });
      });
      
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', ['accessToken=test-token']);
      
      expect(mockControllers.logout).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('POST /refresh-token', () => {
    it('should route to refreshToken controller', async () => {
      const refreshTokenData = {
        refreshToken: 'refresh-token'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send(refreshTokenData);
      
      expect(mockControllers.refreshToken).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });
}); 