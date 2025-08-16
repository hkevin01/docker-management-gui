import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import { dockerPlugin } from './plugins/docker.js';
import { healthRoutes } from './routes/health.js';
import { systemRoutes } from './routes/system/index.js';
import { containerRoutes } from './routes/containers/index.js';
import { imageRoutes } from './routes/images/index.js';
import { volumeRoutes } from './routes/volumes/index.js';
import { networkRoutes } from './routes/networks/index.js';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || 'localhost';

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss.l',
        },
      } : undefined,
    },
  });

  // Register plugins
  await fastify.register(cors, {
    origin: [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // React dev server
      'http://localhost:4173', // Vite preview
    ],
    credentials: true,
  });

  await fastify.register(sensible);
  await fastify.register(websocket);

  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Docker Management API',
        description: 'API for managing Docker resources',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://${HOST}:${PORT}`,
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'health', description: 'Health check endpoints' },
        { name: 'system', description: 'Docker system information' },
        { name: 'containers', description: 'Container management' },
        { name: 'images', description: 'Image management' },
        { name: 'volumes', description: 'Volume management' },
        { name: 'networks', description: 'Network management' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next();
      },
      preHandler: function (request, reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });

  // Register Docker plugin
  await fastify.register(dockerPlugin);

  // Register routes
  await fastify.register(healthRoutes, { prefix: '/api' });
  await fastify.register(systemRoutes, { prefix: '/api/system' });
  await fastify.register(containerRoutes, { prefix: '/api/containers' });
  await fastify.register(imageRoutes, { prefix: '/api/images' });
  await fastify.register(volumeRoutes, { prefix: '/api/volumes' });
  await fastify.register(networkRoutes, { prefix: '/api/networks' });

  return fastify;
}

async function start() {
  try {
    const fastify = await buildServer();
    
    await fastify.listen({ 
      port: PORT, 
      host: HOST 
    });
    
    fastify.log.info(`🚀 Server running on http://${HOST}:${PORT}`);
    fastify.log.info(`📚 API docs available at http://${HOST}:${PORT}/docs`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

export { buildServer };
