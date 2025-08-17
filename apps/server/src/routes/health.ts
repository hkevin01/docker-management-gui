import { FastifyPluginAsync } from 'fastify';
import fs from 'node:fs';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', {
    schema: {
      tags: ['health'],
      description: 'Health check endpoint',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            docker: { type: 'boolean' },
          },
        },
      },
    },
  }, async () => {
    let dockerHealthy = false;
    let socketAccessible = false;
    const socketPath = process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock';
    
    try {
      await fastify.docker.ping();
      dockerHealthy = true;
    } catch (error) {
      fastify.log.warn('Docker health check failed:', {
        error,
        socketPath,
      });
    }

    try {
      const stat = fs.statSync(socketPath);
      socketAccessible = stat.isSocket();
    } catch (e) {
      socketAccessible = false;
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      docker: dockerHealthy,
      dependencies: {
        dockerSocket: socketAccessible,
      },
      safeMode: process.env.SAFE_MODE === 'true',
    };
  });
};

export { healthRoutes };
