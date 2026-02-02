import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WhatsApp & Email Bot API',
      version: '1.0.0',
      description: 'API para envío de mensajes de WhatsApp y correos electrónicos con sistema de facturación',
    },
    servers: [
      {
        url: `${process.env.API_URL || 'http://localhost:3000'}/api`,
        description: 'Servidor principal',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
