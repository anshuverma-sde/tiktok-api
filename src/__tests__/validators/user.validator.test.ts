import {
  updateProfileSchema,
  changePasswordSchema,
  changePasswordBaseSchema
} from '../../validators/user.validator';

describe('User Validators', () => {
  describe('updateProfileSchema', () => {
    it('should validate valid update profile data', () => {
      const validData = {
        name: 'Test User',
        email: 'test@example.com',
        companyName: 'Test Company'
      };
      
      const result = updateProfileSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });
    
    it('should validate valid update profile data without optional fields', () => {
      const validData = {
        name: 'Test User'
      };
      
      const result = updateProfileSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        name: 'Test User',
        email: 'invalid-email'
      };
      
      const result = updateProfileSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.email?._errors).toBeDefined();
      }
    });
    
    it('should reject short name', () => {
      const invalidData = {
        name: 'T'
      };
      
      const result = updateProfileSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.name?._errors).toBeDefined();
      }
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate valid password change data', () => {
      const validData = {
        currentPassword: 'currentPassword123',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };
      
      const result = changePasswordSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });
    
    it('should reject empty current password', () => {
      const invalidData = {
        currentPassword: '',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };
      
      const result = changePasswordSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.currentPassword?._errors).toBeDefined();
      }
    });
    
    it('should reject short new password', () => {
      const invalidData = {
        currentPassword: 'currentPassword123',
        newPassword: 'short',
        confirmPassword: 'short'
      };
      
      const result = changePasswordSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.newPassword?._errors).toBeDefined();
      }
    });
    
    it('should reject short confirm password', () => {
      const invalidData = {
        currentPassword: 'currentPassword123',
        newPassword: 'NewPassword123!',
        confirmPassword: 'short'
      };
      
      const result = changePasswordSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.confirmPassword?._errors).toBeDefined();
      }
    });
    
    it('should reject when passwords don\'t match', () => {
      const invalidData = {
        currentPassword: 'currentPassword123',
        newPassword: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!'
      };
      
      const result = changePasswordSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.confirmPassword?._errors).toBeDefined();
      }
    });
  });
}); 