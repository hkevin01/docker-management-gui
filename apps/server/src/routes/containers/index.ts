import { FastifyPluginAsync } from 'fastify';

const containerRoutes: FastifyPluginAsync = async (fastify) => {
  // List containers
  fastify.get('/', {
    schema: {
      tags: ['containers'],
      description: 'List containers',
      querystring: {
        type: 'object',
        properties: {
          all: { type: 'boolean', default: false },
          limit: { type: 'number' },
          size: { type: 'boolean', default: false },
          filters: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
          },
        },
      },
    },
  }, async (request) => {
    try {
      const { all = false, limit, size = false, filters } = request.query as {
        all?: boolean;
        limit?: number;
        size?: boolean;
        filters?: string;
      };

  const options: any = { all, size };
      if (limit) options.limit = limit;
      if (filters) options.filters = JSON.parse(filters);

  const containers = await fastify.docker.listContainers(options);
      
      return {
        success: true,
        data: containers,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to list containers: ${error}`);
    }
  });

  // Get container details
  fastify.get('/:id', {
    schema: {
      tags: ['containers'],
      description: 'Get container details',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, async (request) => {
    try {
      const { id } = request.params as { id: string };
      const container = fastify.docker.getContainer(id);
      const data = await container.inspect();
      
      return {
        success: true,
        data,
      };
    } catch (error) {
      throw fastify.httpErrors.notFound(`Container not found: ${error}`);
    }
  });

  // Start container
  fastify.post('/:id/start', {
    schema: {
      tags: ['containers'],
      description: 'Start a container',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, async (request) => {
    try {
      const { id } = request.params as { id: string };
      const container = fastify.docker.getContainer(id);
      await container.start();
      
      return {
        success: true,
        message: `Container ${id} started successfully`,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to start container: ${error}`);
    }
  });

  // Stop container
  fastify.post('/:id/stop', {
    schema: {
      tags: ['containers'],
      description: 'Stop a container',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          t: { type: 'number', description: 'Number of seconds to wait before killing the container' },
        },
      },
    },
  }, async (request) => {
    try {
      const { id } = request.params as { id: string };
      const { t } = request.body as { t?: number };
      const container = fastify.docker.getContainer(id);
      await container.stop({ t });
      
      return {
        success: true,
        message: `Container ${id} stopped successfully`,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to stop container: ${error}`);
    }
  });

  // Restart container
  fastify.post('/:id/restart', {
    schema: {
      tags: ['containers'],
      description: 'Restart a container',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          t: { type: 'number', description: 'Number of seconds to wait before killing the container' },
        },
      },
    },
  }, async (request) => {
    try {
      const { id } = request.params as { id: string };
      const { t } = request.body as { t?: number };
      const container = fastify.docker.getContainer(id);
      await container.restart({ t });
      
      return {
        success: true,
        message: `Container ${id} restarted successfully`,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to restart container: ${error}`);
    }
  });

  // Kill container
  fastify.post('/:id/kill', {
    schema: {
      tags: ['containers'],
      description: 'Kill a container',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          signal: { type: 'string', description: 'Signal to send to the container', default: 'SIGKILL' },
        },
      },
    },
  }, async (request) => {
    try {
      const { id } = request.params as { id: string };
      const { signal = 'SIGKILL' } = request.body as { signal?: string };
      const container = fastify.docker.getContainer(id);
      await container.kill({ signal });
      
      return {
        success: true,
        message: `Container ${id} killed successfully`,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to kill container: ${error}`);
    }
  });

  // Remove container
  fastify.delete('/:id', {
    schema: {
      tags: ['containers'],
      description: 'Remove a container',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      querystring: {
        type: 'object',
        properties: {
          force: { type: 'boolean', default: false },
          v: { type: 'boolean', default: false, description: 'Remove volumes' },
          link: { type: 'boolean', default: false },
        },
      },
    },
  }, async (request) => {
    try {
      const { id } = request.params as { id: string };
      const { force = false, v = false, link = false } = request.query as {
        force?: boolean;
        v?: boolean;
        link?: boolean;
      };
      
      const container = fastify.docker.getContainer(id);
      await container.remove({ force, v, link });
      
      return {
        success: true,
        message: `Container ${id} removed successfully`,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to remove container: ${error}`);
    }
  });

  // Logs and stats streaming endpoints will be added later

  // Prune containers
  fastify.post('/prune', {
    schema: {
      tags: ['containers'],
      description: 'Prune unused containers',
      body: {
        type: 'object',
        properties: {
          filters: { type: 'object' },
        },
      },
    },
  }, async (request) => {
    try {
      const { filters } = request.body as { filters?: Record<string, string[]> };
      const result = await fastify.docker.pruneContainers({ filters });
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to prune containers: ${error}`);
    }
  });
};

export { containerRoutes };
