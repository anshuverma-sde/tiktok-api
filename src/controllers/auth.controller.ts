import { Request, Response, RequestHandler } from 'express';
import { AuthService } from '../services/auth.service';
import ErrorHandler from '../utils/errorHandler.util';
import { TryCatch } from '../middlewares/error.middleware';
import { ResponseHandler } from '../utils/responseHandler.util';
import {
  ErrorCodes,
  ErrorMessages,
  HttpStatus,
  SuccessMessages,
} from '../constants/http.constants';
import {
  SignUpInput,
  LoginInput,
  VerifyEmailInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../validators/auth.validator';
import { withTransaction } from '../middlewares/transaction.middleware';
import mongoose from 'mongoose';
import {
  clearAuthenticationCookies,
  setAuthenticationCookies,
} from '../utils/cookie.util';
import logger from '../utils/logger.util';

export const signUp: RequestHandler = TryCatch(
  withTransaction(
    async (req: Request, res: Response, session?: mongoose.ClientSession) => {
      const { email, password, name, companyName } = req.body as SignUpInput;

      const { user } = await AuthService.signUp(
        name,
        email,
        password,
        companyName,
        session
      );
      ResponseHandler.created(
        res,
        { user },
        SuccessMessages.VERIFICATION_EMAIL_SENT
      );
    }
  )
);

export const verifyEmail: RequestHandler = TryCatch(
  async (req: Request, res: Response) => {
    const { token } = req.body as VerifyEmailInput;

    const user = await AuthService.verifyEmail(token);
    ResponseHandler.success(
      res,
      HttpStatus.OK,
      { user },
      SuccessMessages.VERIFIED
    );
  }
);

export const login: RequestHandler = TryCatch(
  async (req: Request, res: Response) => {
    const { email, password, rememberMe } = req.body as LoginInput;

    const { user, accessToken, refreshToken } = await AuthService.login(
      email,
      password,
      rememberMe,
    );
    
    setAuthenticationCookies({
      res, 
      accessToken, 
      refreshToken,
      persistent: rememberMe 
    });
    
    ResponseHandler.success(res, HttpStatus.OK, {
      user,
      accessToken,
      refreshToken,
    }, SuccessMessages.LOGIN);
  },
);

export const forgotPassword: RequestHandler = TryCatch(
  async (req: Request, res: Response) => {
    const { email } = req.body as ForgotPasswordInput;

    await AuthService.forgotPassword(email);
    ResponseHandler.success(
      res,
      HttpStatus.OK,
      undefined,
      SuccessMessages.PASSWORD_RESET_LINK_SENT
    );
  }
);

export const resetPassword: RequestHandler = TryCatch(
  async (req: Request, res: Response) => {
    const { token, newPassword } = req.body as ResetPasswordInput;

    await AuthService.resetPassword(token, newPassword);
    ResponseHandler.success(
      res,
      HttpStatus.OK,
      undefined,
      SuccessMessages.RESET_PASSWORD
    );
  }
);

export const logout: RequestHandler = TryCatch(
  async (req: Request, res: Response) => {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken && !refreshToken) {
      throw new ErrorHandler(
        ErrorMessages.SESSION_EXPIRED,
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.SESSION_EXPIRED
      );
    }
    if (accessToken) {
      await AuthService.logout(accessToken);
    }
    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }
    clearAuthenticationCookies(res);
    ResponseHandler.success(
      res,
      HttpStatus.OK,
      undefined,
      SuccessMessages.LOGGED_OUT
    );
  }
);

export const refreshToken: RequestHandler = TryCatch(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      logger.warn('Refresh token attempt with no refresh token in cookies');
      throw new ErrorHandler(
        ErrorMessages.REFRESH_TOKEN_REQUIRED,
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.REFRESH_TOKEN_REQUIRED
      );
    }
    
    logger.debug('Refresh token found in cookies, attempting to refresh');
    
    const { newAccessToken, newRefreshToken, isPersistent } =
      await AuthService.refreshToken(refreshToken);
    
    logger.debug('Tokens refreshed successfully, setting cookies');

    setAuthenticationCookies({
      res,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      persistent: isPersistent
    });
    
    ResponseHandler.success(
      res,
      HttpStatus.OK,
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      SuccessMessages.REFRESHED
    );
  }
);
