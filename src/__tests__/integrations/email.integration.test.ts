import nodemailer from 'nodemailer';
import { EmailService } from '../../integrations/email.integration';
import ErrorHandler from '../../utils/errorHandler.util';
import { ErrorCodes, HttpStatus } from '../../constants/http.constants';
import logger from '../../utils/logger.util';

jest.mock('nodemailer');
jest.mock('../../utils/logger.util', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('../../config/env', () => ({
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpSecure: 'false',
  smtpUser: 'test@example.com',
  smtpPass: 'password',
  smtpFrom: 'noreply@example.com',
  frontendUrl: 'https://example.com',
}));

describe('EmailService', () => {
  const mockSendMail = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSendMail.mockImplementation(() => {
      return Promise.resolve({ messageId: 'test-id' });
    });
    
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });
    
    Object.defineProperty(EmailService, 'transporter', {
      configurable: true,
      get: () => ({
        sendMail: mockSendMail,
      }),
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      const email = 'test@example.com';
      const token = 'verification-token';

      await EmailService.sendVerificationEmail(email, token);

      expect(mockSendMail).toHaveBeenCalled();
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe(email);
      expect(callArgs.subject).toBe('Verify Your Email');
      expect(logger.info).toHaveBeenCalledWith(`Verification email sent to ${email}`);
    });

    it('should throw error if sending verification email fails', async () => {
      const email = 'test@example.com';
      const token = 'verification-token';
      const error = new Error('SMTP error');
      
      mockSendMail.mockRejectedValueOnce(error);

      await expect(EmailService.sendVerificationEmail(email, token)).rejects.toThrow(ErrorHandler);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(`Failed to send verification email to ${email}`));
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      const email = 'test@example.com';
      const token = 'reset-token';

      await EmailService.sendPasswordResetEmail(email, token);

      expect(mockSendMail).toHaveBeenCalled();
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe(email);
      expect(callArgs.subject).toBe('Password Reset Request');
      expect(logger.info).toHaveBeenCalledWith(`Password reset email sent to ${email}`);
    });

    it('should throw error if sending password reset email fails', async () => {
      const email = 'test@example.com';
      const token = 'reset-token';
      const error = new Error('SMTP error');
      
      mockSendMail.mockRejectedValueOnce(error);

      await expect(EmailService.sendPasswordResetEmail(email, token)).rejects.toThrow(ErrorHandler);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(`Failed to send password reset email to ${email}`));
    });

    it('should include the correct error details when email sending fails', async () => {
      const email = 'test@example.com';
      const token = 'reset-token';
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      try {
        await EmailService.sendPasswordResetEmail(email, token);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ErrorHandler);
        const typedError = error as ErrorHandler;
        expect(typedError.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(typedError.errorCode).toBe(ErrorCodes.EMAIL_FAILED);
      }
    });
  });
}); 