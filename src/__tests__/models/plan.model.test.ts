import { Plan } from '../../models/plan.model';

describe('Plan Model', () => {
  it('should create a valid plan with required fields', () => {
    const planData = {
      name: 'Basic Plan',
      description: 'Entry level plan for small businesses',
      resourceLimits: {
        bots: 5,
        messages: 1000,
        customField: 10
      },
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      stripePriceIdMonthly: 'price_monthly_123',
      stripePriceIdYearly: 'price_yearly_123',
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      active: true
    };
    
    const plan = new Plan(planData);
    
    expect(plan.name).toBe(planData.name);
    expect(plan.description).toBe(planData.description);
    expect(plan.resourceLimits).toEqual(planData.resourceLimits);
    expect(plan.monthlyPrice).toBe(planData.monthlyPrice);
    expect(plan.yearlyPrice).toBe(planData.yearlyPrice);
    expect(plan.stripePriceIdMonthly).toBe(planData.stripePriceIdMonthly);
    expect(plan.stripePriceIdYearly).toBe(planData.stripePriceIdYearly);
    expect(plan.features).toEqual(planData.features);
    expect(plan.active).toBe(planData.active);
  });
  
  it('should use default values when not provided', () => {
    const minimumPlanData = {
      name: 'Minimal Plan',
      description: 'Just the minimum required fields',
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      stripePriceIdMonthly: 'price_minimal_monthly',
      stripePriceIdYearly: 'price_minimal_yearly'
    };
    
    const plan = new Plan(minimumPlanData);
    
    expect(plan.resourceLimits).toEqual({ bots: 0, messages: 0 });
    expect(plan.features).toEqual([]);
    expect(plan.active).toBe(true);
  });
  
  it('should define timestamp fields in the schema', () => {
    const plan = new Plan();
    
    expect(plan.schema.obj).toBeDefined();
    
    const planSchema = (Plan.schema as any);
    if (planSchema && planSchema.options) {
      expect(planSchema.options.timestamps).toBe(true);
    } else {
     
      expect(plan.schema.paths).toBeDefined();
      const pathNames = Object.keys(plan.schema.paths || {});
      expect(pathNames.includes('createdAt') || pathNames.includes('updatedAt')).toBe(true);
    }
  });
  
  it('should validate price fields are positive numbers', () => {
    const invalidPlan = new Plan({
      name: 'Invalid Plan',
      description: 'Testing price validation',
      monthlyPrice: -10,
      yearlyPrice: -100,
      stripePriceIdMonthly: 'price_invalid_monthly',
      stripePriceIdYearly: 'price_invalid_yearly'
    });
    
    const validationError = invalidPlan.validateSync();
    
    expect(validationError).toBeDefined();
    if (validationError && validationError.errors) {
      expect(validationError.errors.monthlyPrice || 
             validationError.errors['monthlyPrice']).toBeDefined();
      expect(validationError.errors.yearlyPrice || 
             validationError.errors['yearlyPrice']).toBeDefined();
    }
  });
}); 