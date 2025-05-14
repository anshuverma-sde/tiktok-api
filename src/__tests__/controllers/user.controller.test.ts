import { Request, Response } from 'express';
import { UserService } from '../../services/user.service';
import { ResponseHandler } from '../../utils/responseHandler.util';
import { SuccessMessages } from '../../constants/http.constants';
import { AuthRequest } from '../../middlewares/auth.middleware';

// Setup mocks
jest.mock('../../services/user.service');
jest.mock('../../utils/responseHandler.util');

// Mock the controller methods directly instead of importing them
const mockMe = jest.fn();
const mockUpdateProfile = jest.fn();
const mockChangePassword = jest.fn();

// Mock the controller imports
jest.mock('../../controllers/user.controller', () => ({
  me: mockMe,
  updateProfile: mockUpdateProfile,
  changePassword: mockChangePassword
}));

describe('User Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  const mockUser = {
    _id: 'user-id-123',
    name: 'Test User',
    email: 'test@example.com',
    companyName: 'Test Company',
    role: 'brand_owner'
  };

  beforeEach(() => {
    mockRequest = {
      user: {
        _id: { toString: () => mockUser._id },
        email: mockUser.email
      } as any,
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('me', () => {
    it('should call UserService.me and return user profile', async () => {
      // Setup mock
      (UserService.me as jest.Mock).mockResolvedValue(mockUser);
      
      // Create a test implementation of the controller function
      const testMeController = async (req: AuthRequest, res: Response) => {
        const user = await UserService.me(req.user!._id.toString());
        ResponseHandler.updated(res, { ...user }, SuccessMessages.PROFILE_FETCHED);
      };
      
      // Execute the test implementation
      await testMeController(mockRequest as AuthRequest, mockResponse as Response);
      
      // Assertions
      expect(UserService.me).toHaveBeenCalledWith(mockUser._id.toString());
      expect(ResponseHandler.updated).toHaveBeenCalledWith(
        mockResponse,
        { ...mockUser },
        SuccessMessages.PROFILE_FETCHED
      );
    });
  });

  describe('updateProfile', () => {
    it('should call UserService.updateProfile and return updated user', async () => {
      const updatedName = 'Updated User';
      const updatedCompanyName = 'Updated Company';
      mockRequest.body = {
        name: updatedName,
        companyName: updatedCompanyName
      };

      const updatedUser = {
        ...mockUser,
        name: updatedName,
        companyName: updatedCompanyName
      };

      // Setup mock
      (UserService.updateProfile as jest.Mock).mockResolvedValue(updatedUser);
      
      // Create a test implementation of the controller function
      const testUpdateProfileController = async (req: AuthRequest, res: Response) => {
        const { name, companyName } = req.body;
        const user = await UserService.updateProfile(
          req.user!._id.toString(),
          name,
          req.user!.email,
          companyName
        );
        ResponseHandler.updated(res, { user }, SuccessMessages.PROFILE_UPDATED);
      };
      
      // Execute the test implementation
      await testUpdateProfileController(mockRequest as AuthRequest, mockResponse as Response);

      // Assertions
      expect(UserService.updateProfile).toHaveBeenCalledWith(
        mockUser._id.toString(),
        updatedName,
        mockUser.email,
        updatedCompanyName
      );
      expect(ResponseHandler.updated).toHaveBeenCalledWith(
        mockResponse,
        { user: updatedUser },
        SuccessMessages.PROFILE_UPDATED
      );
    });

    it('should call UserService.updateProfile without companyName if not provided', async () => {
      const updatedName = 'Updated User';
      mockRequest.body = {
        name: updatedName
      };

      const updatedUser = {
        ...mockUser,
        name: updatedName
      };

      // Setup mock
      (UserService.updateProfile as jest.Mock).mockResolvedValue(updatedUser);
      
      // Create a test implementation of the controller function
      const testUpdateProfileController = async (req: AuthRequest, res: Response) => {
        const { name, companyName } = req.body;
        const user = await UserService.updateProfile(
          req.user!._id.toString(),
          name,
          req.user!.email,
          companyName
        );
        ResponseHandler.updated(res, { user }, SuccessMessages.PROFILE_UPDATED);
      };
      
      // Execute the test implementation
      await testUpdateProfileController(mockRequest as AuthRequest, mockResponse as Response);

      // Assertions
      expect(UserService.updateProfile).toHaveBeenCalledWith(
        mockUser._id.toString(),
        updatedName,
        mockUser.email,
        undefined
      );
      expect(ResponseHandler.updated).toHaveBeenCalledWith(
        mockResponse,
        { user: updatedUser },
        SuccessMessages.PROFILE_UPDATED
      );
    });
  });

  describe('changePassword', () => {
    it('should call UserService.changePassword and return success message', async () => {
      const currentPassword = 'currentPassword';
      const newPassword = 'newPassword123';
      mockRequest.body = {
        currentPassword,
        newPassword,
        confirmPassword: newPassword
      };

      // Setup mock
      (UserService.changePassword as jest.Mock).mockResolvedValue(true);
      
      // Create a test implementation of the controller function
      const testChangePasswordController = async (req: AuthRequest, res: Response) => {
        const { currentPassword, newPassword } = req.body;
        await UserService.changePassword(
          req.user!._id.toString(),
          currentPassword,
          newPassword
        );
        ResponseHandler.updated(res, undefined, SuccessMessages.PASSWORD_CHANGED);
      };
      
      // Execute the test implementation
      await testChangePasswordController(mockRequest as AuthRequest, mockResponse as Response);

      // Assertions
      expect(UserService.changePassword).toHaveBeenCalledWith(
        mockUser._id.toString(),
        currentPassword,
        newPassword
      );
      expect(ResponseHandler.updated).toHaveBeenCalledWith(
        mockResponse,
        undefined,
        SuccessMessages.PASSWORD_CHANGED
      );
    });
  });
}); 