import swaggerJsdoc from 'swagger-jsdoc';
import env from './env';

// Define a generic type for Swagger specification
interface SwaggerSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string; description: string }>;
  components: {
    securitySchemes: Record<string, { type: string; scheme?: string; bearerFormat?: string }>;
  };
  paths: Record<string, Partial<{
    get: {
      summary: string;
      description: string;
      responses: Record<string, { description: string; content: Record<string, { schema: { type: string; example: string } }> }>;
    };
  }>>;
}

const swaggerOptions: swaggerJsdoc.Options = {
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
  apis: ['src/routes/v1/*.ts'], // Will include authRoutes and userRoutes when uncommented
};

// Generate Swagger spec with type assertion
const swaggerSpec = swaggerJsdoc(swaggerOptions) as SwaggerSpec;

// Manually define the health check route
const healthCheckSpec = {
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
                  example: '<h1>Site is Working. Click <a href="http://localhost:3000">here</a> to visit frontend.</h1>',
                },
              },
            },
          },
        },
      },
    },
  },
};

// Merge health check spec with swaggerSpec
swaggerSpec.paths = {
  ...swaggerSpec.paths,
  ...healthCheckSpec.paths,
};

export default swaggerSpec;
