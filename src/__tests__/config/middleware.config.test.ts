import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { configureMiddleware } from '../../config/middleware.config';
import logger from '../../utils/logger.util';
import env from '../../config/env';

jest.mock('express', () => {
  const mockExpressModule = () => {
    return {
      use: jest.fn()
    };
  };
  
  mockExpressModule.json = jest.fn(() => 'json-middleware');
  mockExpressModule.urlencoded = jest.fn(() => 'urlencoded-middleware');
  
  return mockExpressModule;
});

jest.mock('cors', () => jest.fn(() => 'cors-middleware'));
jest.mock('helmet', () => jest.fn(() => 'helmet-middleware'));
jest.mock('express-rate-limit', () => {
  return jest.fn((options) => {
    (rateLimit as any).lastOptions = options;
    return 'rate-limit-middleware';
  });
});
jest.mock('morgan', () => jest.fn(() => 'morgan-middleware'));
jest.mock('cookie-parser', () => jest.fn(() => 'cookie-parser-middleware'));
jest.mock('../../utils/logger.util', () => ({
  morganStream: 'morgan-stream',
  warn: jest.fn(),
}));
jest.mock('../../config/env', () => ({
  frontendUrl: 'http://localhost:3000',
}));

describe('Middleware Configuration', () => {
  let app: express.Application;
  
  beforeEach(() => {
    jest.clearAllMocks();
    app = express() as any;
  });
  
  it('should configure all middleware correctly', () => {
    configureMiddleware(app);
    
    expect(helmet).toHaveBeenCalledWith({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", env.frontendUrl],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-origin' },
    });
    expect(app.use).toHaveBeenCalledWith('helmet-middleware');
    
    expect(rateLimit).toHaveBeenCalledWith(expect.objectContaining({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      handler: expect.any(Function),
    }));
    expect(app.use).toHaveBeenCalledWith('rate-limit-middleware');
    
    expect(express.json).toHaveBeenCalledWith({ limit: '10kb' });
    expect(app.use).toHaveBeenCalledWith('json-middleware');
    
    expect(express.urlencoded).toHaveBeenCalledWith({ 
      extended: true, 
      limit: '10kb' 
    });
    expect(app.use).toHaveBeenCalledWith('urlencoded-middleware');
    
    expect(cookieParser).toHaveBeenCalled();
    expect(app.use).toHaveBeenCalledWith('cookie-parser-middleware');
    
    expect(morgan).toHaveBeenCalledWith('combined', { 
      stream: logger.morganStream 
    });
    expect(app.use).toHaveBeenCalledWith('morgan-middleware');
    
    expect(cors).toHaveBeenCalledWith({
      origin: env.frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Set-Cookie'],
      maxAge: 86400,
    });
    expect(app.use).toHaveBeenCalledWith('cors-middleware');
  });
  
  it('should test the rate limit handler', () => {
    configureMiddleware(app);
    
    const handler = (rateLimit as any).lastOptions.handler;
    
    expect(handler).toBeDefined();
    
    const mockReq = { ip: '127.0.0.1' } as express.Request;
    const mockRes = {} as express.Response;
    const mockNext = jest.fn();
    
    handler(mockReq, mockRes, mockNext);
    
    expect(mockNext).toHaveBeenCalled();
    const error = mockNext.mock.calls[0][0];
    expect(error.message).toBe('Too many requests, please try again later.');
    expect(error.statusCode).toBe(429);
  });
}); 