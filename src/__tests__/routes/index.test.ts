import express, { Request, Response } from 'express';
import { configureRoutes } from '../../routes/index';
import v1Routes from '../../routes/v1';
import logger from '../../utils/logger.util';
import env from '../../config/env';

jest.mock('../../routes/v1', () => 'mock-v1-routes');
jest.mock('../../utils/logger.util', () => ({
  info: jest.fn(),
}));
jest.mock('../../config/env', () => ({
  frontendUrl: 'http://localhost:3000',
}));

describe('Route Configuration', () => {
  let app: express.Application;
  let mockGet: jest.Mock;
  let mockUse: jest.Mock;
  let mockSend: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSend = jest.fn().mockReturnThis();
    const mockRes = {
      send: mockSend,
    };
    
    mockGet = jest.fn((path, handler) => {
      if (path === '/') {
        handler({} as Request, mockRes as unknown as Response);
      }
      return app;
    });
    
    mockUse = jest.fn().mockReturnThis();
    
    app = {
      get: mockGet,
      use: mockUse,
    } as unknown as express.Application;
  });
  
  it('should configure health check route', () => {
    configureRoutes(app);
    
    expect(mockGet).toHaveBeenCalledWith('/', expect.any(Function));
    
    expect(logger.info).toHaveBeenCalledWith('Health check requested');
    
    const expectedHtml = `<h1>Site is Working. Click <a href="${env.frontendUrl}">here</a> to visit frontend.</h1>`;
    expect(mockSend).toHaveBeenCalledWith(expectedHtml);
  });
  
  it('should configure API v1 routes', () => {
    configureRoutes(app);
    
    expect(mockUse).toHaveBeenCalledWith('/api/v1', v1Routes);
  });
}); 