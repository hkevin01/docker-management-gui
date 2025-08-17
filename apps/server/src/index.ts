import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import rateLimit from '@fastify/rate-limit';
import { dockerPlugin } from './plugins/docker.js';
import { healthRoutes } from './routes/health.js';
import { systemRoutes } from './routes/system/index.js';
import { containerRoutes } from './routes/containers/index.js';
import { imageRoutes } from './routes/images/index.js';
import { volumeRoutes } from './routes/volumes/index.js';
import { networkRoutes } from './routes/networks/index.js';
import { metricsRoute } from './routes/metrics.js';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || 'localhost';

type BuildOptions = {
  docker?: any;
};

async function buildServer(options: BuildOptions = {}) {
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
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost:(5173|3000|4173|8086)$/.test(origin)
      ) {
        return cb(null, true);
      }
      cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  await fastify.register(sensible);
  await fastify.register(websocket);
  await fastify.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
    allowList: (req: any) => {
      const ip = req.ip || '';
      return ip === '127.0.0.1' || ip === '::1';
    },
  });

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

  // Register Docker plugin or inject provided docker client (for tests)
  if (options.docker) {
    fastify.decorate('docker', options.docker);
  } else {
    await fastify.register(dockerPlugin);
  }

  // Register routes
  await fastify.register(healthRoutes, { prefix: '/api' });
  await fastify.register(systemRoutes, { prefix: '/api/system' });
  await fastify.register(containerRoutes, { prefix: '/api/containers' });
  await fastify.register(imageRoutes, { prefix: '/api/images' });
  await fastify.register(volumeRoutes, { prefix: '/api/volumes' });
  await fastify.register(networkRoutes, { prefix: '/api/networks' });
  await fastify.register(metricsRoute, { prefix: '/' });

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

// Start server only when executed directly (works for both CJS and ESM builds)
const isDirectRun = typeof require !== 'undefined'
  ? require.main === module // CommonJS
  : (typeof import.meta !== 'undefined' && typeof process !== 'undefined' &&
     `file://${process.argv[1]}` === (import.meta as any).url); // ESM

if (isDirectRun) {
  start();
}

export { buildServer };
