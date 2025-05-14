import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';

const mockControllers = {
  me: jest.fn((req: Request, res: Response) => res.status(200).json({ success: true })),
  updateProfile: jest.fn((req: Request, res: Response) => res.status(200).json({ success: true })),
  changePassword: jest.fn((req: Request, res: Response) => res.status(200).json({ success: true }))
};

const mockAuthenticate = jest.fn((req: Request, res: Response, next: NextFunction) => next());

// Mock validateRequest to return a middleware function immediately
const mockValidateRequestMiddleware = jest.fn((req: Request, res: Response, next: NextFunction) => next());
const mockValidateRequest = jest.fn(() => mockValidateRequestMiddleware);

// Create mock validator schemas
const mockUpdateProfileSchema = { name: 'updateProfileSchema' };
const mockChangePasswordSchema = { name: 'changePasswordSchema' };

jest.mock('../../../controllers/user.controller', () => mockControllers);
jest.mock('../../../middlewares/auth.middleware', () => ({
  authenticate: mockAuthenticate
}));
jest.mock('../../../middlewares/validation.middleware', () => ({
  validateRequest: mockValidateRequest
}));
jest.mock('../../../validators/user.validator', () => ({
  updateProfileSchema: mockUpdateProfileSchema,
  changePasswordSchema: mockChangePasswordSchema
}));

import userRoutes from '../../../routes/v1/user.routes';

describe('User Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use('/api/v1/user', userRoutes);
  });

  describe('GET /me', () => {
    it('should route to me controller with authentication', async () => {
      const response = await request(app)
        .get('/api/v1/user/me');
      
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockControllers.me).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('PUT /profile', () => {
    it('should route to updateProfile controller with validation and authentication', async () => {
      const profileData = {
        name: 'Updated User',
        email: 'updated@example.com',
        companyName: 'Updated Company'
      };
      
      const response = await request(app)
        .put('/api/v1/user/profile')
        .send(profileData);
      
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockControllers.updateProfile).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('POST /change-password', () => {
    it('should route to changePassword controller with validation and authentication', async () => {
      const passwordData = {
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };
      
      const response = await request(app)
        .post('/api/v1/user/change-password')
        .send(passwordData);
      
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockControllers.changePassword).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });
}); 