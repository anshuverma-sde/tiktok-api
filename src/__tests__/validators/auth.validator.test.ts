import {
  signUpSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../../validators/auth.validator';

describe('Auth Validators', () => {
  describe('signUpSchema', () => {
    it('should validate valid signup data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
        companyName: 'Test Company'
      };
      
      const result = signUpSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });
    
    it('should validate valid signup data without company name', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User'
      };
      
      const result = signUpSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123!',
        name: 'Test User'
      };
      
      const result = signUpSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.email?._errors).toBeDefined();
      }
    });
    
    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
        name: 'Test User'
      };
      
      const result = signUpSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.password?._errors).toBeDefined();
      }
    });
    
    it('should reject short name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'T'
      };
      
      const result = signUpSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.name?._errors).toBeDefined();
      }
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const result = loginSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });
    
    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      };
      
      const result = loginSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.email?._errors).toBeDefined();
      }
    });
    
    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: ''
      };
      
      const result = loginSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.password?._errors).toBeDefined();
      }
    });
  });

  describe('verifyEmailSchema', () => {
    it('should validate valid verification token', () => {
      const validData = {
        token: 'valid-token-123456789012345678901234'
      };
      
      const result = verifyEmailSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });
    
    it('should reject empty token', () => {
      const invalidData = {
        token: ''
      };
      
      const result = verifyEmailSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.token?._errors).toBeDefined();
      }
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should validate valid email', () => {
      const validData = {
        email: 'test@example.com'
      };
      
      const result = forgotPasswordSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });
    
    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email'
      };
      
      const result = forgotPasswordSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.email?._errors).toBeDefined();
      }
    });
  });

  describe('resetPasswordSchema', () => {
    it('should validate valid reset password data', () => {
      const validData = {
        token: 'valid-token-123456789012345678901234',
        newPassword: 'NewPassword123!'
      };
      
      const result = resetPasswordSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });
    
    it('should reject invalid token', () => {
      const invalidData = {
        token: '',
        newPassword: 'NewPassword123!'
      };
      
      const result = resetPasswordSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.token?._errors).toBeDefined();
      }
    });
    
    it('should reject invalid password', () => {
      const invalidData = {
        token: 'valid-token-123456789012345678901234',
        newPassword: 'short'
      };
      
      const result = resetPasswordSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.newPassword?._errors).toBeDefined();
      }
    });
  });
}); 