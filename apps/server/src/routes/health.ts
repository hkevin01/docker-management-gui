import { FastifyPluginAsync } from 'fastify';

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
    
    try {
      await fastify.docker.ping();
      dockerHealthy = true;
    } catch (error) {
      fastify.log.warn('Docker health check failed:', {
        error,
        socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
      });
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      docker: dockerHealthy,
    };
  });
};

export { healthRoutes };
