import dotenv from 'dotenv';
import { Secret } from 'jsonwebtoken';
import ms from 'ms';

dotenv.config();

interface Env {
  nodeEnv: string;
  port: number;
  frontendUrl: string;
  mongoUri: string;
  dbName: string;
  stripeSecretKey: string;
  stripePriceIds: Record<string, string>;
  tiktokClientId: string;
  tiktokClientSecret: string;
  tiktokApiBaseUrl: string;
  tiktokOAuthUrl: string;
  tiktokRedirectUri: string;
  smtpHost: string;
  smtpPort: string;
  smtpSecure: string;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  accessTokenSecret: Secret;
  refreshTokenSecret: Secret;
  accessTokenExpiresIn: ms.StringValue;
  refreshTokenExpiresIn: ms.StringValue;
  accessTokenExpiresInLong:ms.StringValue;
  refreshTokenExpiresInLong:ms.StringValue;
  cookieDomain?: string;
}

const env: Env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/tiktok-shop',
  dbName: process.env.DB_NAME || 'tiktok-shop',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePriceIds: {
    basic_monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || '',
    basic_yearly: process.env.STRIPE_PRICE_BASIC_YEARLY || '',
    pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
    advanced_monthly: process.env.STRIPE_PRICE_ADVANCED_MONTHLY || '',
    advanced_yearly: process.env.STRIPE_PRICE_ADVANCED_YEARLY || '',
  },
  tiktokClientId: process.env.TIKTOK_CLIENT_ID || '',
  tiktokClientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
  tiktokApiBaseUrl: process.env.TIKTOK_API_BASE_URL || 'https://api.tiktok.com',
  tiktokOAuthUrl:
    process.env.TIKTOK_OAUTH_URL || 'https://auth.tiktok.com/oauth/authorize',
  tiktokRedirectUri:
    process.env.TIKTOK_REDIRECT_URI ||
    'http://localhost:5000/api/v1/shops/callback',
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: process.env.SMTP_PORT || '587',
  smtpSecure: process.env.SMTP_SECURE || 'false',
  smtpUser: process.env.SMTP_USER || 'smtp.dev@devtrust.online',
  smtpPass: process.env.SMTP_PASS || 'osonywmojyxgkrsi',
  smtpFrom: process.env.SMTP_FROM || 'smtp.dev@devtrust.online',
  accessTokenSecret:
    process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret',
  refreshTokenSecret:
    process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret',
  accessTokenExpiresIn: (process.env.ACCESS_TOKEN_EXPIRES_IN ||
    '15m') as ms.StringValue,
  refreshTokenExpiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN ||
    '7d') as ms.StringValue,
  accessTokenExpiresInLong: (process.env.ACCESS_TOKEN_EXPIRES_IN_LONG || '1d') as ms.StringValue,
  refreshTokenExpiresInLong: (process.env.REFRESH_TOKEN_EXPIRES_IN_LONG || '30d') as ms.StringValue,
  cookieDomain: process.env.COOKIE_DOMAIN,
};

export default env;
