import { FastifyPluginAsync } from 'fastify';
import { DockerSystemInfo, DockerSystemDf } from '@docker-gui/shared-types';

const systemRoutes: FastifyPluginAsync = async (fastify) => {
  // Get Docker system information
  fastify.get('/info', {
    schema: {
      tags: ['system'],
      description: 'Get Docker system information',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
  }, async () => {
    try {
      const info = await fastify.docker.info() as DockerSystemInfo;
      return {
        success: true,
        data: info,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to get system info: ${error}`);
    }
  });

  // Get Docker disk usage
  fastify.get('/df', {
    schema: {
      tags: ['system'],
      description: 'Get Docker disk usage information',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
  }, async () => {
    try {
      const df = await fastify.docker.df() as DockerSystemDf;
      return {
        success: true,
        data: df,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to get disk usage: ${error}`);
    }
  });

  // Stream Docker events
  fastify.get('/events', {
    schema: {
      tags: ['system'],
      description: 'Stream Docker events via Server-Sent Events',
      querystring: {
        type: 'object',
        properties: {
          since: { type: 'string' },
          until: { type: 'string' },
          filters: { type: 'string' },
        },
      },
    },
    websocket: true,
  }, async (connection) => {
    try {
      const eventStream = await fastify.docker.getEvents({
        since: Date.now() / 1000,
      });

      eventStream.on('data', (chunk) => {
        try {
          const event = JSON.parse(chunk.toString());
          connection.socket.send(JSON.stringify({
            type: 'event',
            data: event,
          }));
        } catch (err) {
          fastify.log.error('Error parsing Docker event:', err);
        }
      });

      eventStream.on('error', (error) => {
        fastify.log.error('Docker events stream error:', error);
        connection.socket.send(JSON.stringify({
          type: 'error',
          error: error.message,
        }));
      });

      connection.socket.on('close', () => {
        eventStream.destroy();
      });

      connection.socket.on('error', (error) => {
        fastify.log.error('WebSocket error:', error);
        eventStream.destroy();
      });
    } catch (error) {
      connection.socket.send(JSON.stringify({
        type: 'error',
        error: `Failed to start event stream: ${error}`,
      }));
    }
  });

  // System prune
  fastify.post('/prune', {
    schema: {
      tags: ['system'],
      description: 'Prune unused Docker objects',
      body: {
        type: 'object',
        properties: {
          filters: { type: 'object' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
  }, async (request) => {
    try {
      const { filters } = request.body as { filters?: Record<string, string[]> };
      
      // Docker doesn't have a direct system prune API method, 
      // we need to prune each resource type individually
      const containerResult = await fastify.docker.pruneContainers({ filters });
      const imageResult = await fastify.docker.pruneImages({ filters });
      const volumeResult = await fastify.docker.pruneVolumes({ filters });
      const networkResult = await fastify.docker.pruneNetworks({ filters });
      
      const result = {
        containers: containerResult,
        images: imageResult,
        volumes: volumeResult,
        networks: networkResult,
      };
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to prune system: ${error}`);
    }
  });
};

export { systemRoutes };
