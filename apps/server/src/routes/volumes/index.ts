import { FastifyPluginAsync } from 'fastify';

function assertNotSafeMode(fastify: any) {
  if (process.env.SAFE_MODE === 'true') {
    throw fastify.httpErrors.forbidden('Operation disabled in SAFE_MODE');
  }
}

const volumeRoutes: FastifyPluginAsync = async (fastify) => {
  // List volumes
  fastify.get('/', {
    schema: {
      tags: ['volumes'],
      description: 'List volumes',
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

      // Get volume list and disk usage data in parallel
      const [volumeResult, dfResult] = await Promise.all([
        fastify.docker.listVolumes(options),
        fastify.docker.df().catch(() => null) // Don't fail if df is unavailable
      ]);

      // Create a map of volume sizes from df data
      const volumeSizes: Record<string, { Size: number; RefCount: number }> = {};
      if (dfResult?.Volumes) {
        dfResult.Volumes.forEach((volume: any) => {
          if (volume.Name) {
            volumeSizes[volume.Name] = {
              Size: volume.Size || 0,
              RefCount: volume.Links || 0
            };
          }
        });
      }

      // Enhance volume data with size information
      const result = volumeResult as any;
      if (result?.Volumes) {
        result.Volumes = result.Volumes.map((volume: any) => ({
          ...volume,
          UsageData: volumeSizes[volume.Name] || { Size: 0, RefCount: 0 }
        }));
      }
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to list volumes: ${error}`);
    }
  });

  // Get volume details
  fastify.get('/:name', {
    schema: {
      tags: ['volumes'],
      description: 'Get volume details',
      params: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      },
    },
  }, async (request) => {
    try {
      const { name } = request.params as { name: string };
      const volume = fastify.docker.getVolume(name);
      const data = await volume.inspect();
      
      return {
        success: true,
        data,
      };
    } catch (error) {
      throw fastify.httpErrors.notFound(`Volume not found: ${error}`);
    }
  });

  // Create volume
  fastify.post('/', {
    schema: {
      tags: ['volumes'],
      description: 'Create a volume',
      body: {
        type: 'object',
        properties: {
          Name: { type: 'string' },
          Driver: { type: 'string', default: 'local' },
          DriverOpts: { type: 'object' },
          Labels: { type: 'object' },
        },
      },
    },
  }, async (request) => {
    try {
  assertNotSafeMode(fastify);
      const options = request.body as any;
      const volume = await fastify.docker.createVolume(options);
      
      return {
        success: true,
        data: volume,
        message: 'Volume created successfully',
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to create volume: ${error}`);
    }
  });

  // Remove volume
  fastify.delete('/:name', {
    schema: {
      tags: ['volumes'],
      description: 'Remove a volume',
      params: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      },
      querystring: {
        type: 'object',
        properties: {
          force: { type: 'boolean', default: false },
        },
      },
    },
  }, async (request) => {
    try {
  assertNotSafeMode(fastify);
      const { name } = request.params as { name: string };
      const { force = false } = request.query as { force?: boolean };
      
      const volume = fastify.docker.getVolume(name);
      await volume.remove({ force });
      
      return {
        success: true,
        message: `Volume ${name} removed successfully`,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to remove volume: ${error}`);
    }
  });

  // Prune volumes
  fastify.post('/prune', {
    schema: {
      tags: ['volumes'],
      description: 'Prune unused volumes',
      body: {
        type: 'object',
        properties: {
          filters: { type: 'object' },
        },
      },
    },
  }, async (request) => {
    try {
  assertNotSafeMode(fastify);
      const { filters } = request.body as { filters?: Record<string, string[]> };
      const result = await fastify.docker.pruneVolumes({ filters });
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to prune volumes: ${error}`);
    }
  });
};

export { volumeRoutes };
