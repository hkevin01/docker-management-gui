import { FastifyPluginAsync } from 'fastify';

const networkRoutes: FastifyPluginAsync = async (fastify) => {
  // List networks
  fastify.get('/', {
    schema: {
      tags: ['networks'],
      description: 'List networks',
      querystring: {
        type: 'object',
        properties: {
          filters: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    try {
      const { filters } = request.query as { filters?: string };
      const options: any = {};
      if (filters) options.filters = JSON.parse(filters);

      const networks = await fastify.docker.listNetworks(options);
      
      return {
        success: true,
        data: networks,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to list networks: ${error}`);
    }
  });

  // Get network details
  fastify.get('/:id', {
    schema: {
      tags: ['networks'],
      description: 'Get network details',
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
      const network = fastify.docker.getNetwork(id);
      const data = await network.inspect();
      
      return {
        success: true,
        data,
      };
    } catch (error) {
      throw fastify.httpErrors.notFound(`Network not found: ${error}`);
    }
  });

  // Create network
  fastify.post('/', {
    schema: {
      tags: ['networks'],
      description: 'Create a network',
      body: {
        type: 'object',
        properties: {
          Name: { type: 'string' },
          Driver: { type: 'string', default: 'bridge' },
          IPAM: { type: 'object' },
          Options: { type: 'object' },
          Labels: { type: 'object' },
        },
        required: ['Name'],
      },
    },
  }, async (request) => {
    try {
      const options = request.body as any;
      const network = await fastify.docker.createNetwork(options);
      
      return {
        success: true,
        data: network,
        message: 'Network created successfully',
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to create network: ${error}`);
    }
  });

  // Remove network
  fastify.delete('/:id', {
    schema: {
      tags: ['networks'],
      description: 'Remove a network',
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
      const network = fastify.docker.getNetwork(id);
      await network.remove();
      
      return {
        success: true,
        message: `Network ${id} removed successfully`,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to remove network: ${error}`);
    }
  });

  // Connect container to network
  fastify.post('/:id/connect', {
    schema: {
      tags: ['networks'],
      description: 'Connect a container to network',
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
          Container: { type: 'string' },
          EndpointConfig: { type: 'object' },
        },
        required: ['Container'],
      },
    },
  }, async (request) => {
    try {
      const { id } = request.params as { id: string };
      const options = request.body as any;
      const network = fastify.docker.getNetwork(id);
      await network.connect(options);
      
      return {
        success: true,
        message: 'Container connected to network successfully',
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to connect container: ${error}`);
    }
  });

  // Disconnect container from network
  fastify.post('/:id/disconnect', {
    schema: {
      tags: ['networks'],
      description: 'Disconnect a container from network',
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
          Container: { type: 'string' },
          Force: { type: 'boolean', default: false },
        },
        required: ['Container'],
      },
    },
  }, async (request) => {
    try {
      const { id } = request.params as { id: string };
      const options = request.body as any;
      const network = fastify.docker.getNetwork(id);
      await network.disconnect(options);
      
      return {
        success: true,
        message: 'Container disconnected from network successfully',
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to disconnect container: ${error}`);
    }
  });

  // Prune networks
  fastify.post('/prune', {
    schema: {
      tags: ['networks'],
      description: 'Prune unused networks',
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
      const result = await fastify.docker.pruneNetworks({ filters });
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to prune networks: ${error}`);
    }
  });
};

export { networkRoutes };
