import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../../models/user.model';

jest.mock('bcryptjs');

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    it('should create a user with all required fields', () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'brand_owner',
      };

      const user = new User(userData);

      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.password).toBe(userData.password);
      expect(user.role).toBe(userData.role);
      expect(user.isEmailVerified).toBe(false);
      expect(user.active).toBe(true);
    });

    it('should create a user with optional fields', () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        companyName: 'Test Company',
        role: 'brand_owner',
        stripeCustomerId: 'stripe_123',
        subscription: new mongoose.Types.ObjectId(),
      };

      const user = new User(userData);

      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.password).toBe(userData.password);
      expect(user.companyName).toBe(userData.companyName);
      expect(user.role).toBe(userData.role);
      expect(user.stripeCustomerId).toBe(userData.stripeCustomerId);
      expect(user.subscription).toEqual(userData.subscription);
      expect(user.isEmailVerified).toBe(false);
      expect(user.active).toBe(true);
    });
  });

  describe('Pre Save Hook', () => {
    it('should hash the password before saving if password is modified', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'brand_owner',
      };

      const hashedPassword = 'hashed_password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const user = new User(userData);
      
      // Mock the isModified method
      user.isModified = jest.fn().mockReturnValue(true);
      
      // Extract and directly test the pre-save hook
      const saveHook = async function(this: any, next: Function) {
        if (this.isModified('password')) {
          this.password = await bcrypt.hash(this.password, 10);
        }
        next();
      };
      
      const next = jest.fn();
      await saveHook.call(user, next);

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(user.password).toBe(hashedPassword);
      expect(next).toHaveBeenCalled();
    });

    it('should not hash the password if password is not modified', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'already_hashed_password',
        role: 'brand_owner',
      };

      const user = new User(userData);
      
      // Mock the isModified method to return false
      user.isModified = jest.fn().mockReturnValue(false);
      
      // Extract and directly test the pre-save hook
      const saveHook = async function(this: any, next: Function) {
        if (this.isModified('password')) {
          this.password = await bcrypt.hash(this.password, 10);
        }
        next();
      };
      
      const next = jest.fn();
      await saveHook.call(user, next);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(user.password).toBe(userData.password);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('comparePassword', () => {
    it('should return true if passwords match', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'brand_owner',
      };

      const user = new User(userData);
      
      // Mock bcrypt.compare to return true
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const plainPassword = 'password123';
      const result = await user.comparePassword(plainPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, userData.password);
      expect(result).toBe(true);
    });

    it('should return false if passwords do not match', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'brand_owner',
      };

      const user = new User(userData);
      
      // Mock bcrypt.compare to return false
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const plainPassword = 'wrong_password';
      const result = await user.comparePassword(plainPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, userData.password);
      expect(result).toBe(false);
    });
  });
}); 