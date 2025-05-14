import mongoose from 'mongoose';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { EmailService } from '../../integrations/email.integration';
import { ErrorMessages, HttpStatus, ErrorCodes } from '../../constants/http.constants';

jest.mock('../../models/user.model');
jest.mock('../../integrations/email.integration');

describe('UserService', () => {
  // Mock user data
  const mockUser = {
    _id: 'user-id-123',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    companyName: 'Test Company',
    role: 'brand_owner',
    comparePassword: jest.fn(),
    save: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('me', () => {
    it('should return user profile data', async () => {
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.me(mockUser._id);

      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual({
        _id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        companyName: mockUser.companyName,
        role: mockUser.role
      });
    });

    it('should throw an error if user is not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(UserService.me(mockUser._id)).rejects.toThrow(
        expect.objectContaining({
          message: ErrorMessages.SESSION_EXPIRED,
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCodes.SESSION_EXPIRED
        })
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile data', async () => {
      const updatedName = 'Updated User';
      const updatedCompanyName = 'Updated Company';

      (User.findById as jest.Mock).mockResolvedValue({
        ...mockUser,
        save: jest.fn().mockResolvedValue({
          ...mockUser,
          name: updatedName,
          companyName: updatedCompanyName
        })
      });

      const result = await UserService.updateProfile(
        mockUser._id,
        updatedName,
        mockUser.email,
        updatedCompanyName
      );

      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual({
        _id: mockUser._id,
        name: updatedName,
        email: mockUser.email,
        companyName: updatedCompanyName,
        role: mockUser.role
      });
    });

    it('should update user profile without changing companyName if not provided', async () => {
      const updatedName = 'Updated User';

      (User.findById as jest.Mock).mockResolvedValue({
        ...mockUser,
        save: jest.fn().mockResolvedValue({
          ...mockUser,
          name: updatedName
        })
      });

      const result = await UserService.updateProfile(
        mockUser._id,
        updatedName,
        mockUser.email
      );

      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual({
        _id: mockUser._id,
        name: updatedName,
        email: mockUser.email,
        companyName: mockUser.companyName,
        role: mockUser.role
      });
    });

    it('should throw an error if user is not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(UserService.updateProfile(
        mockUser._id,
        'Updated User',
        mockUser.email
      )).rejects.toThrow(
        expect.objectContaining({
          message: ErrorMessages.USER_NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
          errorCode: ErrorCodes.USER_NOT_FOUND
        })
      );
    });
  });

  describe('changePassword', () => {
    it('should change user password successfully', async () => {
      const currentPassword = 'currentPassword';
      const newPassword = 'newPassword123';

      const mockUserWithMethods = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue({
          ...mockUser,
          password: 'hashedNewPassword'
        })
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUserWithMethods);
      (EmailService.sendPasswordChangeConfirmationEmail as jest.Mock).mockResolvedValue(true);

      const result = await UserService.changePassword(
        mockUser._id,
        currentPassword,
        newPassword
      );

      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
      expect(mockUserWithMethods.comparePassword).toHaveBeenCalledWith(currentPassword);
      expect(mockUserWithMethods.save).toHaveBeenCalled();
      expect(EmailService.sendPasswordChangeConfirmationEmail).toHaveBeenCalledWith(mockUser.email);
      expect(result).toBe(true);
    });

    it('should throw an error if user is not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(UserService.changePassword(
        mockUser._id,
        'currentPassword',
        'newPassword123'
      )).rejects.toThrow(
        expect.objectContaining({
          message: ErrorMessages.USER_NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
          errorCode: ErrorCodes.USER_NOT_FOUND
        })
      );
    });

    it('should throw an error if current password is incorrect', async () => {
      const mockUserWithMethods = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUserWithMethods);

      await expect(UserService.changePassword(
        mockUser._id,
        'wrongPassword',
        'newPassword123'
      )).rejects.toThrow(
        expect.objectContaining({
          message: "Incorrect password. Please try again.",
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCodes.INVALID_EMAIL_PASSWORD
        })
      );
    });

    it('should complete password change even if email sending fails', async () => {
      const currentPassword = 'currentPassword';
      const newPassword = 'newPassword123';

      const mockUserWithMethods = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue({
          ...mockUser,
          password: 'hashedNewPassword'
        })
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUserWithMethods);
      (EmailService.sendPasswordChangeConfirmationEmail as jest.Mock).mockRejectedValue(new Error('Email sending failed'));
      
      // Mock console.error to prevent logging during test
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await UserService.changePassword(
        mockUser._id,
        currentPassword,
        newPassword
      );

      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
      expect(mockUserWithMethods.comparePassword).toHaveBeenCalledWith(currentPassword);
      expect(mockUserWithMethods.save).toHaveBeenCalled();
      expect(EmailService.sendPasswordChangeConfirmationEmail).toHaveBeenCalledWith(mockUser.email);
      expect(result).toBe(true);
      
      // Restore console.error
      (console.error as jest.Mock).mockRestore();
    });
  });
}); 