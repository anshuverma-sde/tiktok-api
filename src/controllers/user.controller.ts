import { Response } from 'express';
import { TryCatch } from '../middlewares/error.middleware';
import { UserService } from '../services/user.service';
import { ResponseHandler } from '../utils/responseHandler.util';
import { AuthRequest } from '../middlewares/auth.middleware';
import { SuccessMessages } from '../constants/http.constants';
import { ChangePasswordInput, UpdateProfileInput } from '../validators/user.validator';
import logger from '../utils/logger.util';

export const me = TryCatch(async (req: AuthRequest, res: Response) => {
  logger.debug(`Fetching profile for user: ${req.user!._id}`);
  const user = await UserService.me(req.user!._id.toString());
  ResponseHandler.updated(res, { ...user }, SuccessMessages.PROFILE_FETCHED);
});

export const updateProfile = TryCatch(async (req: AuthRequest, res: Response) => {
  const { name, companyName } = req.body as UpdateProfileInput;
  
  logger.debug(`Updating profile for user: ${req.user!._id}, name: ${name}, company: ${companyName}`);
  
  // Use the email from the authenticated user object instead of from the request
  const user = await UserService.updateProfile(
    req.user!._id.toString(),
    name,
    req.user!.email, // Use email from authenticated user, ignore any email in request body
    companyName
  );
  
  ResponseHandler.updated(res, { user }, SuccessMessages.PROFILE_UPDATED);
});

export const changePassword = TryCatch(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body as ChangePasswordInput;
  
  logger.debug(`Changing password for user: ${req.user!._id}`);
  
  await UserService.changePassword(
    req.user!._id.toString(),
    currentPassword,
    newPassword
  );
  
  ResponseHandler.updated(res, undefined, SuccessMessages.PASSWORD_CHANGED);
});
