import nodemailer from 'nodemailer';
import env from '../config/env';
import ErrorHandler from '../utils/errorHandler.util';
import { ErrorCodes, ErrorMessages, HttpStatus } from '../constants/http.constants';
import logger from '../utils/logger.util';

export class EmailService {
  private static readonly transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: Number(env.smtpPort),
    secure: env.smtpSecure === 'true',
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  static async sendVerificationEmail(email: string, token: string): Promise<void> {
    try {
      const verificationUrl = `${env.frontendUrl}/verify-email?token=${token}`;
      await this.transporter.sendMail({
        from: env.smtpFrom,
        to: email,
        subject: 'Verify Your Email',
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f7f7; color: #333333;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);">
            <!-- Header -->
            <tr>
              <td style="padding: 30px 0; text-align: center; background-color: #ff0050;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">TikTok Influencer Marketing</h1>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="margin-top: 0; color: #333333; font-size: 24px;">Verify Your Email Address</h2>
                <p style="margin-bottom: 24px; font-size: 16px; line-height: 1.6;">Thank you for joining our TikTok Influencer Marketing Platform. To get started, please verify your email address.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" style="display: inline-block; background-color: #ff0050; color: white; text-decoration: none; padding: 14px 30px; border-radius: 4px; font-weight: 600; font-size: 16px;">Verify Email</a>
                </div>
                
                <p style="margin-top: 24px; font-size: 14px; color: #666666;">If you did not request this verification, please ignore this email.</p>
                <p style="font-size: 14px; color: #666666;">This link will expire in 10 minutes.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 14px; color: #666666;">
                  <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
                  <p style="word-break: break-all; font-size: 12px; color: #888888;">${verificationUrl}</p>
                </div>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666666;">
                <p>&copy; ${new Date().getFullYear()} TikTok Influencer Marketing. All rights reserved.</p>
                <p>Please do not reply to this email.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
        `,
      });
      logger.info(`Verification email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send verification email to ${email}: ${error}`);
      throw new ErrorHandler(
        ErrorMessages.EMAIL_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.EMAIL_FAILED,
      );
    }
  }

  static async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    try {
      const resetUrl = `${env.frontendUrl}/reset-password?token=${token}`;
      await this.transporter.sendMail({
        from: env.smtpFrom,
        to: email,
        subject: 'Password Reset Request',
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Request</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f7f7; color: #333333;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);">
            <!-- Header -->
            <tr>
              <td style="padding: 30px 0; text-align: center; background-color: #ff0050;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">TikTok Influencer Marketing</h1>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="margin-top: 0; color: #333333; font-size: 24px;">Password Reset Request</h2>
                <p style="margin-bottom: 24px; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background-color: #ff0050; color: white; text-decoration: none; padding: 14px 30px; border-radius: 4px; font-weight: 600; font-size: 16px;">Reset Password</a>
                </div>
                
                <p style="margin-top: 24px; font-size: 14px; color: #666666;">If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                <p style="font-size: 14px; color: #666666;">This link will expire in 1 hour.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 14px; color: #666666;">
                  <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
                  <p style="word-break: break-all; font-size: 12px; color: #888888;">${resetUrl}</p>
                </div>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666666;">
                <p>&copy; ${new Date().getFullYear()} TikTok Influencer Marketing. All rights reserved.</p>
                <p>Please do not reply to this email.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
        `,
      });
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send password reset email to ${email}: ${error}`);
      throw new ErrorHandler(
        ErrorMessages.EMAIL_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.EMAIL_FAILED,
      );
    }
  }

  static async sendPasswordChangeConfirmationEmail(email: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: env.smtpFrom,
        to: email,
        subject: 'Password Changed Successfully',
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Changed Successfully</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f7f7; color: #333333;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);">
            <!-- Header -->
            <tr>
              <td style="padding: 30px 0; text-align: center; background-color: #ff0050;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">TikTok Influencer Marketing</h1>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="margin-top: 0; color: #333333; font-size: 24px;">Password Changed Successfully</h2>
                <p style="margin-bottom: 24px; font-size: 16px; line-height: 1.6;">Your password has been changed successfully.</p>
                
                <p style="margin-top: 24px; font-size: 14px; color: #666666;">If you did not request this change, please contact our support team immediately.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${env.frontendUrl}/login" style="display: inline-block; background-color: #ff0050; color: white; text-decoration: none; padding: 14px 30px; border-radius: 4px; font-weight: 600; font-size: 16px;">Go to Login</a>
                </div>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666666;">
                <p>&copy; ${new Date().getFullYear()} TikTok Influencer Marketing. All rights reserved.</p>
                <p>Please do not reply to this email.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
        `,
      });
      logger.info(`Password change confirmation email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send password change confirmation email to ${email}: ${error}`);
      throw new ErrorHandler(
        ErrorMessages.EMAIL_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.EMAIL_FAILED,
      );
    }
  }
}
