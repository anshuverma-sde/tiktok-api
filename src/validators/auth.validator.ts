import { z } from 'zod';
import { EmailSchema, PasswordSchema, TokenSchema } from './index';

// Sign up schema
export const signUpSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  companyName: z.string().optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

// Login schema - Updated to include rememberMe field
export const loginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, { message: 'Password is required' }),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Email verification schema
export const verifyEmailSchema = z.object({
  token: TokenSchema,
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: EmailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Reset password schema
export const resetPasswordSchema = z.object({
  token: TokenSchema,
  newPassword: PasswordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;