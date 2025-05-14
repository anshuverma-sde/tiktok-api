import {
  ErrorCodes,
  ErrorMessages,
  HttpStatus,
} from '../constants/http.constants';
import { User } from '../models/user.model';
import { VerificationToken } from '../models/verification-token.model';
import { ResetToken } from '../models/reset-token.model';
import ErrorHandler from '../utils/errorHandler.util';
import { EmailService } from '../integrations/email.integration';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { Session } from '../models/session.model';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { LoginAttempt } from '../models/login-attempt.model';

interface JwtPayload {
  userId: string;
  role?: string;
  exp: number;
}

export class AuthService {
  static async signUp(
    name: string,
    email: string,
    password: string,
    companyName?: string,
    session?: mongoose.ClientSession
  ) {
    const existingUser = await User.findOne({ email });

    if (existingUser && !existingUser.isEmailVerified) {
      const activeToken = await VerificationToken.findOne({
        userId: existingUser._id,
        expiresAt: { $gt: new Date() },
      });

      if (!activeToken) {
        await User.deleteOne({ _id: existingUser._id });
      } else {
        throw new ErrorHandler(
          ErrorMessages.VERIFICATION_EMAIL_ALREADY_SENT,
          HttpStatus.BAD_REQUEST,
          ErrorCodes.EMAIL_EXISTS
        );
      }
    } else if (existingUser) {
      throw new ErrorHandler(
        ErrorMessages.EMAIL_EXISTS,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.EMAIL_EXISTS
      );
    }

    const user = new User({
      name,
      email,
      password,
      companyName,
      role: 'brand_owner',
      isEmailVerified: false,
    });
    await user.save({ session });

    const token = crypto.randomBytes(32).toString('hex');
    const verificationToken = new VerificationToken({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await verificationToken.save({ session });

    await EmailService.sendVerificationEmail(email, token);

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      companyName: user.companyName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { user: safeUser, token };
  }

  static async verifyEmail(token: string) {
    const verificationToken = await VerificationToken.findOne({ token });
    if (!verificationToken) {
      throw new ErrorHandler(
        ErrorMessages.INVALID_VERIFICATION_TOKEN,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.INVALID_VERIFICATION_TOKEN
      );
    }

    if (verificationToken.expiresAt < new Date()) {
      await VerificationToken.deleteOne({ _id: verificationToken._id });
      throw new ErrorHandler(
        ErrorMessages.INVALID_VERIFICATION_TOKEN,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.INVALID_VERIFICATION_TOKEN
      );
    }

    const user = await User.findById(verificationToken.userId);
    if (!user) {
      throw new ErrorHandler(
        ErrorMessages.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        ErrorCodes.USER_NOT_FOUND
      );
    }

    user.isEmailVerified = true;
    await user.save();
    await VerificationToken.deleteOne({ _id: verificationToken._id });

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      companyName: user.companyName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return safeUser;
  }

  static async login(email: string, password: string, rememberMe: boolean) {
    // Check login attempts for this email
    const loginAttempts = await this.getLoginAttempts(email);
    
    // If too many attempts, lock the account temporarily
    if (loginAttempts.count >= 5 && loginAttempts.lastAttempt > Date.now() - 15 * 60 * 1000) {
      throw new ErrorHandler(
        ErrorMessages.TOO_MANY_ATTEMPTS,
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCodes.TOO_MANY_ATTEMPTS,
      );
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      await this.incrementLoginAttempts(email);
      throw new ErrorHandler(
        ErrorMessages.INVALID_EMAIL_PASSWORD,
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.INVALID_EMAIL_PASSWORD
      );
    }

    if (!user.isEmailVerified) {
      await this.incrementLoginAttempts(email);
      throw new ErrorHandler(
        ErrorMessages.EMAIL_NOT_VERIFIED,
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.EMAIL_NOT_VERIFIED
      );
    }
    
    if (user.active === false) {
      throw new ErrorHandler(
        ErrorMessages.ACCOUNT_INACTIVE,
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.ACCOUNT_INACTIVE,
      );
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await this.incrementLoginAttempts(email);
      throw new ErrorHandler(
        ErrorMessages.INVALID_EMAIL_PASSWORD,
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.INVALID_EMAIL_PASSWORD
      );
    }

    await this.resetLoginAttempts(email);

    const accessTokenExpiresIn = rememberMe ? env.accessTokenExpiresInLong : env.accessTokenExpiresIn;
    const refreshTokenExpiresIn = rememberMe ? env.refreshTokenExpiresInLong : env.refreshTokenExpiresIn;

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      env.accessTokenSecret,
      { expiresIn: accessTokenExpiresIn },
    );

    const refreshToken = jwt.sign(
      { userId: user._id, role: user.role },
      env.refreshTokenSecret,
      { expiresIn: refreshTokenExpiresIn },
    );

    const accessTokenPayload = jwt.decode(accessToken) as JwtPayload;
    const refreshTokenPayload = jwt.decode(refreshToken) as JwtPayload;

    const session = new Session({
      userId: user._id,
      accessToken,
      refreshToken,
      accessTokenExpiresAt: new Date(accessTokenPayload.exp * 1000),
      refreshTokenExpiresAt: new Date(refreshTokenPayload.exp * 1000),
      role: user.role,
      persistent: rememberMe,
    });
    await session.save();

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      companyName: user.companyName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      active:user.active
    };

    return { user: safeUser, accessToken, refreshToken };
  }
  
  private static async getLoginAttempts(email: string) {
    const record = await LoginAttempt.findOne({ email });
    if (!record) {
      return { count: 0, lastAttempt: 0 };
    }
    return { count: record.count, lastAttempt: record.updatedAt.getTime() };
  }
  
  private static async incrementLoginAttempts(email: string) {
    const record = await LoginAttempt.findOneAndUpdate(
      { email },
      { $inc: { count: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true }
    );
    return record.count;
  }
  
  private static async resetLoginAttempts(email: string) {
    await LoginAttempt.findOneAndDelete({ email });
  }

  static async forgotPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ErrorHandler(
        ErrorMessages.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        ErrorCodes.USER_NOT_FOUND
      );
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const resetToken = new ResetToken({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });
    await resetToken.save();

    // Send reset email
    await EmailService.sendPasswordResetEmail(email, token);
  }

  static async resetPassword(token: string, newPassword: string) {
    const resetToken = await ResetToken.findOne({ token });
    if (!resetToken) {
      throw new ErrorHandler(
        ErrorMessages.INVALID_RESET_TOKEN,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.INVALID_RESET_TOKEN
      );
    }

    if (resetToken.expiresAt < new Date()) {
      await ResetToken.deleteOne({ _id: resetToken._id });
      throw new ErrorHandler(
        ErrorMessages.INVALID_RESET_TOKEN,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.INVALID_RESET_TOKEN
      );
    }

    const user = await User.findById(resetToken.userId);
    if (!user) {
      throw new ErrorHandler(
        ErrorMessages.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        ErrorCodes.USER_NOT_FOUND
      );
    }

    user.password = newPassword;
    await user.save();
    await ResetToken.deleteOne({ _id: resetToken._id });
  }

  static async logout(token: string) {
    await Session.deleteMany({
      $or: [{ accessToken: token }, { refreshToken: token }],
    });
  }

  static async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        env.refreshTokenSecret
      ) as JwtPayload;

      // Find session by refresh token
      const session = await Session.findOne({ refreshToken });

      if (!session) {
        throw new ErrorHandler(
          ErrorMessages.INVALID_REFRESH_TOKEN,
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.INVALID_REFRESH_TOKEN
        );
      }

      // Check if refresh token is expired
      if (session.refreshTokenExpiresAt < new Date()) {
        await Session.deleteOne({ _id: session._id });
        throw new ErrorHandler(
          ErrorMessages.INVALID_REFRESH_TOKEN,
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.INVALID_REFRESH_TOKEN
        );
      }

      // Use the persistent flag from the session
      const isPersistent = session.persistent || false;
      const accessExpiresIn = isPersistent ? env.accessTokenExpiresInLong : env.accessTokenExpiresIn;
      const refreshExpiresIn = isPersistent ? env.refreshTokenExpiresInLong : env.refreshTokenExpiresIn;

      // Generate new tokens
      const newAccessToken = jwt.sign(
        { userId: decoded.userId, role: decoded.role },
        env.accessTokenSecret,
        { expiresIn: accessExpiresIn }
      );

      const newRefreshToken = jwt.sign(
        { userId: decoded.userId, role: decoded.role },
        env.refreshTokenSecret,
        { expiresIn: refreshExpiresIn }
      );

      // Update session with new tokens
      const accessTokenPayload = jwt.decode(newAccessToken) as JwtPayload;
      const refreshTokenPayload = jwt.decode(newRefreshToken) as JwtPayload;

      session.accessToken = newAccessToken;
      session.refreshToken = newRefreshToken;
      session.accessTokenExpiresAt = new Date(accessTokenPayload.exp * 1000);
      session.refreshTokenExpiresAt = new Date(refreshTokenPayload.exp * 1000);
      await session.save();

      return { newAccessToken, newRefreshToken, isPersistent };
    } catch (error) {
      // If JWT verification fails (expired token), delete the session
      if (error instanceof jwt.TokenExpiredError) {
        const session = await Session.findOne({ refreshToken });
        if (session) {
          await Session.deleteOne({ _id: session._id });
        }
      }
      throw error;
    }
  }

  static async cleanupUnverifiedUsers() {
    const unverifiedUsers = await User.find({ isEmailVerified: false });

    for (const user of unverifiedUsers) {
      const activeToken = await VerificationToken.findOne({
        userId: user._id,
        expiresAt: { $gt: new Date() },
      });

      if (!activeToken) {
        await User.deleteOne({ _id: user._id });
      }
    }
  }
}
