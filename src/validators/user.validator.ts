import { z } from 'zod';
import { EmailSchema, PasswordSchema } from './index';

// Update profile schema
export const updateProfileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: EmailSchema.optional(),
  companyName: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Change password schema - separated into base and refined for middleware compatibility
export const changePasswordBaseSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: PasswordSchema,
  confirmPassword: z.string().min(8, { message: 'Confirm password must be at least 8 characters' }),
});

// We'll use this for middleware validation
export const changePasswordSchema = changePasswordBaseSchema.refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
);

export type ChangePasswordInput = z.infer<typeof changePasswordBaseSchema>; 