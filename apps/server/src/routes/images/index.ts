import { FastifyPluginAsync } from 'fastify';
import { DockerImage } from '@docker-gui/shared-types';

const imageRoutes: FastifyPluginAsync = async (fastify) => {
  // List images
  fastify.get('/', {
    schema: {
      tags: ['images'],
      description: 'List images',
      querystring: {
        type: 'object',
        properties: {
          all: { type: 'boolean', default: false },
          filters: { type: 'string' },
          digests: { type: 'boolean', default: false },
        },
      },
    },
  }, async (request) => {
    try {
      const { all = false, filters, digests = false } = request.query as {
        all?: boolean;
        filters?: string;
        digests?: boolean;
      };

      const options: any = { all, digests };
      if (filters) options.filters = JSON.parse(filters);

      const images = await fastify.docker.listImages(options) as DockerImage[];
      
      return {
        success: true,
        data: images,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to list images: ${error}`);
    }
  });

  // Get image details
  fastify.get('/:id', {
    schema: {
      tags: ['images'],
      description: 'Get image details',
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
      const image = fastify.docker.getImage(id);
      const data = await image.inspect();
      
      return {
        success: true,
        data,
      };
    } catch (error) {
      throw fastify.httpErrors.notFound(`Image not found: ${error}`);
    }
  });

  // Pull image
  fastify.post('/pull', {
    schema: {
      tags: ['images'],
      description: 'Pull an image',
      body: {
        type: 'object',
        properties: {
          repoTag: { type: 'string' },
          tag: { type: 'string' },
          authconfig: { type: 'object' },
        },
        required: ['repoTag'],
      },
    },
    websocket: true,
  }, async (connection, request) => {
    try {
      const { repoTag, tag, authconfig } = request.body as {
        repoTag: string;
        tag?: string;
        authconfig?: any;
      };

      const pullStream = await fastify.docker.pull(repoTag, { tag, authconfig });
      
      pullStream.on('data', (chunk) => {
        try {
          const data = JSON.parse(chunk.toString());
          connection.socket.send(JSON.stringify(data));
        } catch (err) {
          connection.socket.send(chunk.toString());
        }
      });

      pullStream.on('error', (error) => {
        connection.socket.send(JSON.stringify({
          error: error.message,
        }));
      });

      pullStream.on('end', () => {
        connection.socket.send(JSON.stringify({
          status: 'Pull complete',
        }));
        connection.socket.close();
      });

      connection.socket.on('close', () => {
        pullStream.destroy();
      });
    } catch (error) {
      connection.socket.send(JSON.stringify({
        error: `Failed to pull image: ${error}`,
      }));
      connection.socket.close();
    }
  });

  // Remove image
  fastify.delete('/:id', {
    schema: {
      tags: ['images'],
      description: 'Remove an image',
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
          noprune: { type: 'boolean', default: false },
        },
      },
    },
  }, async (request) => {
    try {
      const { id } = request.params as { id: string };
      const { force = false, noprune = false } = request.query as {
        force?: boolean;
        noprune?: boolean;
      };
      
      const image = fastify.docker.getImage(id);
      const result = await image.remove({ force, noprune });
      
      return {
        success: true,
        data: result,
        message: `Image ${id} removed successfully`,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to remove image: ${error}`);
    }
  });

  // Prune images
  fastify.post('/prune', {
    schema: {
      tags: ['images'],
      description: 'Prune unused images',
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
      const result = await fastify.docker.pruneImages({ filters });
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to prune images: ${error}`);
    }
  });
};

export { imageRoutes };
