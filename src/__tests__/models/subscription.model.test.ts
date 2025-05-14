import mongoose from 'mongoose';
import { Subscription, ISubscription } from '../../models/subscription.model';

const mockNow = new Date('2023-01-01T00:00:00Z');
const originalDate = global.Date;

describe('Subscription Model', () => {
  let subscription: mongoose.Document & ISubscription;
  const mockUserId = new mongoose.Types.ObjectId();
  const mockPlanId = new mongoose.Types.ObjectId();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    global.Date = class extends originalDate {
      constructor() {
        super();
        return mockNow;
      }
      
      static now() {
        return mockNow.getTime();
      }
    } as any;
    
    subscription = new Subscription({
      userId: mockUserId,
      plan: mockPlanId,
      period: 'monthly',
      stripeSubscriptionId: 'sub_123456',
      status: 'active',
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), 
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),   
      resourceUsage: {
        bots: 5,
        messages: 100,
        custom: 10
      }
    });
    
    subscription.save = jest.fn().mockResolvedValue(subscription);
  });
  
  afterEach(() => {
    global.Date = originalDate;
  });
  
  describe('resetResourceUsage', () => {
    it('should reset resource usage to zero', async () => {
      expect(subscription.resourceUsage).toEqual({
        bots: 5,
        messages: 100,
        custom: 10
      });
      
      await subscription.resetResourceUsage();
      
      expect(subscription.resourceUsage).toEqual({
        bots: 0,
        messages: 0
      });
      
      expect(subscription.save).toHaveBeenCalled();
    });
  });
  
  describe('renew', () => {
    it('should renew a monthly subscription correctly', async () => {
      subscription.period = 'monthly';
      
      subscription.resetResourceUsage = jest.fn().mockResolvedValue(undefined);
      
      await subscription.renew();
      
      expect(subscription.startDate).toEqual(mockNow);
      
      const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
      expect(subscription.endDate).toEqual(new Date(mockNow.getTime() + oneMonthMs));
      
      expect(subscription.status).toBe('active');
      
      expect(subscription.resetResourceUsage).toHaveBeenCalled();
      
      expect(subscription.save).toHaveBeenCalled();
    });
    
    it('should renew a yearly subscription correctly', async () => {
      subscription.period = 'yearly';
      
      subscription.resetResourceUsage = jest.fn().mockResolvedValue(undefined);
      
      await subscription.renew();
      
      expect(subscription.startDate).toEqual(mockNow);
      
      const oneYearMs = 365 * 24 * 60 * 60 * 1000;
      expect(subscription.endDate).toEqual(new Date(mockNow.getTime() + oneYearMs));
      
      expect(subscription.status).toBe('active');
      
      expect(subscription.resetResourceUsage).toHaveBeenCalled();
      
      expect(subscription.save).toHaveBeenCalled();
    });
  });
}); 