const originalEnv = process.env;

describe('Environment Configuration', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv }; 
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should use fallback values when environment variables are explicitly deleted', () => {
    process.env = {};
    
    const env = require('../../config/env').default;

    expect(env.nodeEnv).toBe('development');
    expect(env.port).toBe(5000);
    expect(env.frontendUrl).toBeDefined();
    expect(env.mongoUri).toBeDefined();
    expect(env.dbName).toBeDefined();
    expect(typeof env.port).toBe('number');
  });

  it('should override values when environment variables are provided', () => {
    process.env.NODE_ENV = 'production';
    process.env.PORT = '8080';
    process.env.FRONTEND_URL = 'https://example.com';
    process.env.MONGO_URI = 'mongodb://custom-mongo-host:27017/custom-db';
    process.env.DB_NAME = 'custom-db';
    process.env.STRIPE_SECRET_KEY = 'stripe-secret-key-123';
    process.env.TIKTOK_CLIENT_ID = 'tiktok-client-id-123';
    process.env.TIKTOK_API_BASE_URL = 'https://api-custom.tiktok.com';
    process.env.SMTP_HOST = 'smtp.custom.com';
    process.env.ACCESS_TOKEN_SECRET = 'custom-access-token-secret';
    process.env.ACCESS_TOKEN_EXPIRES_IN = '30m';

    const env = require('../../config/env').default;

    expect(env.nodeEnv).toBe('production');
    expect(env.port).toBe(8080);
    expect(env.frontendUrl).toBe('https://example.com');
    expect(env.mongoUri).toBe('mongodb://custom-mongo-host:27017/custom-db');
    expect(env.dbName).toBe('custom-db');
    expect(env.stripeSecretKey).toBe('stripe-secret-key-123');
    expect(env.tiktokClientId).toBe('tiktok-client-id-123');
    expect(env.tiktokApiBaseUrl).toBe('https://api-custom.tiktok.com');
    expect(env.smtpHost).toBe('smtp.custom.com');
    expect(env.accessTokenSecret).toBe('custom-access-token-secret');
    expect(env.accessTokenExpiresIn).toBe('30m');
  });

  it('should set stripe price IDs from environment variables', () => {
    process.env = {};
    process.env.STRIPE_PRICE_BASIC_MONTHLY = 'price_basic_monthly';
    process.env.STRIPE_PRICE_PRO_YEARLY = 'price_pro_yearly';

    const env = require('../../config/env').default;

    expect(env.stripePriceIds.basic_monthly).toBe('price_basic_monthly');
    expect(env.stripePriceIds.pro_yearly).toBe('price_pro_yearly');
    
    expect(env.stripePriceIds.advanced_monthly).toBeDefined();
  });

  it('should handle SMTP secure as boolean equivalent', () => {
    process.env = {};
    process.env.SMTP_SECURE = 'true';
    let env = require('../../config/env').default;
    expect(env.smtpSecure).toBe('true');

    jest.resetModules();
    process.env = {};
    process.env.SMTP_SECURE = 'false';
    env = require('../../config/env').default;
    expect(env.smtpSecure).toBe('false');
  });

  it('should handle various token expiration formats', () => {
    process.env = {};
    process.env.ACCESS_TOKEN_EXPIRES_IN = '2d';
    process.env.REFRESH_TOKEN_EXPIRES_IN = '30d';
    let env = require('../../config/env').default;
    expect(env.accessTokenExpiresIn).toBe('2d');
    expect(env.refreshTokenExpiresIn).toBe('30d');

    jest.resetModules();
    process.env = {};
    process.env.ACCESS_TOKEN_EXPIRES_IN = '12h';
    process.env.REFRESH_TOKEN_EXPIRES_IN = '168h';
    env = require('../../config/env').default;
    expect(env.accessTokenExpiresIn).toBe('12h');
    expect(env.refreshTokenExpiresIn).toBe('168h');

    jest.resetModules();
    process.env = {};
    process.env.ACCESS_TOKEN_EXPIRES_IN = '3600s';
    process.env.REFRESH_TOKEN_EXPIRES_IN = '86400s';
    env = require('../../config/env').default;
    expect(env.accessTokenExpiresIn).toBe('3600s');
    expect(env.refreshTokenExpiresIn).toBe('86400s');
  });
}); 