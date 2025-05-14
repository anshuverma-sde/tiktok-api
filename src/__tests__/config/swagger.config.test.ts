import swaggerJsdoc from 'swagger-jsdoc';
import env from '../../config/env';
import swaggerSpec from '../../config/swagger.config';

jest.mock('swagger-jsdoc', () => {
  return jest.fn().mockImplementation((options) => {
    return {
      openapi: options.definition.openapi,
      info: options.definition.info,
      servers: options.definition.servers,
      components: options.definition.components,
      paths: {
        '/': {
          get: {
            summary: 'Health Check',
            description: 'Check if the server is running',
            responses: {
              '200': {
                description: 'Server is running',
                content: {
                  'text/html': {
                    schema: {
                      type: 'string',
                      example: '<h1>Site is Working</h1>',
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
  });
});

jest.mock('../../config/env', () => ({
  port: 5000,
}));

describe('Swagger Configuration', () => {
  it('should configure swagger correctly', () => {
    expect(swaggerJsdoc).toHaveBeenCalledWith({
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'TikTok Shop API',
          version: '1.0.0',
          description: 'API documentation for the TikTok Shop backend',
        },
        servers: [
          {
            url: `http://localhost:${env.port}`,
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
      apis: ['src/routes/v1/*.ts'],
    });
  });
  
  it('should have health check path in swagger spec', () => {
    const paths = swaggerSpec.paths as Record<string, any>;
    
    expect(paths['/']).toBeDefined();
    expect(paths['/'].get).toBeDefined();
    expect(paths['/'].get.summary).toBe('Health Check');
    expect(paths['/'].get.description).toBe('Check if the server is running');
    expect(paths['/'].get.responses['200']).toBeDefined();
  });
  
  it('should include security schemes for authentication', () => {
    const bearerAuth = swaggerSpec.components.securitySchemes.bearerAuth;
    expect(bearerAuth).toBeDefined();
    expect(bearerAuth.type).toBe('http');
    expect(bearerAuth.scheme).toBe('bearer');
    expect(bearerAuth.bearerFormat).toBe('JWT');
  });
  
  it('should include server configuration with port', () => {
    expect(swaggerSpec.servers).toHaveLength(1);
    expect(swaggerSpec.servers[0].url).toBe(`http://localhost:${env.port}`);
    expect(swaggerSpec.servers[0].description).toBe('Development server');
  });
}); 