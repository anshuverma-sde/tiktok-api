import {
  ErrorCodes,
  ErrorMessages,
  HttpStatus,
} from '../constants/http.constants';
import { User } from '../models/user.model';
import ErrorHandler from '../utils/errorHandler.util';
import { EmailService } from '../integrations/email.integration';

export class UserService {
  static async me(_id: string) {
    const user = await User.findById(_id);

    if (!user) {
      throw new ErrorHandler(
        ErrorMessages.SESSION_EXPIRED,
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.SESSION_EXPIRED
      );
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      companyName: user.companyName,
      role: user.role,
    };
  }

  static async updateProfile(_id: string, name: string, email: string, companyName?: string) {
    // Don't check or update email - it's no longer updateable
    
    const user = await User.findById(_id);
    if (!user) {
      throw new ErrorHandler(
        ErrorMessages.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        ErrorCodes.USER_NOT_FOUND
      );
    }

    user.name = name;
    // No longer update email
    if (companyName !== undefined) {
      user.companyName = companyName;
    }

    await user.save();

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      companyName: user.companyName,
      role: user.role,
    };
  }

  static async changePassword(_id: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(_id);
    if (!user) {
      throw new ErrorHandler(
        ErrorMessages.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        ErrorCodes.USER_NOT_FOUND
      );
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new ErrorHandler(
        "Incorrect password. Please try again.",
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.INVALID_EMAIL_PASSWORD
      );
    }

    user.password = newPassword;
    await user.save();

    // Send confirmation email
    try {
      await EmailService.sendPasswordChangeConfirmationEmail(user.email);
    } catch (error) {
      console.error('Failed to send password change confirmation email', error);
      // We don't want to fail the request if the email fails
    }

    return true;
  }
}
