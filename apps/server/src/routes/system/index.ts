import { FastifyPluginAsync } from 'fastify';
import { PassThrough } from 'stream';

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
  const info = await fastify.docker.info();
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
  const df = await fastify.docker.df();
      return {
        success: true,
        data: df,
      };
    } catch (error) {
      throw fastify.httpErrors.internalServerError(`Failed to get disk usage: ${error}`);
    }
  });

  // Docker events via WebSocket
  fastify.get('/events', { websocket: true }, (connection, req) => {
    const sinceStr = (req.query as any)?.since as string | undefined;
    const untilStr = (req.query as any)?.until as string | undefined;
    const filtersStr = (req.query as any)?.filters as string | undefined;
    const filters = filtersStr ? JSON.parse(filtersStr) : undefined;
    const since = sinceStr ? Number(sinceStr) : undefined;
    const until = untilStr ? Number(untilStr) : undefined;

    let closed = false;
  (connection as any).socket.on('close', () => { closed = true; });

  (fastify.docker as any).getEvents({ since, until, filters }, (err: any, stream: NodeJS.ReadableStream) => {
      if (err) {
        fastify.log.error({ err }, 'events stream error');
  try { (connection as any).socket.close(); } catch {}
        return;
      }

      const passthrough = new PassThrough();
      stream.pipe(passthrough);

      const sendChunk = (chunk: Buffer) => {
        if (closed) return;
        // basic backpressure using ws bufferedAmount
  if (((connection as any).socket.bufferedAmount as number) > 1_000_000) {
          // drop if too slow, could also implement queueing
          return;
        }
        try {
          (connection as any).socket.send(chunk.toString());
        } catch (e) {
          fastify.log.warn({ e }, 'events send failed');
        }
      };

      passthrough.on('data', sendChunk);
      passthrough.on('error', (e) => fastify.log.error({ e }, 'events passthrough error'));
      passthrough.on('close', () => {
  try { (connection as any).socket.close(); } catch {}
      });

  (connection as any).socket.on('close', () => {
        try { (stream as any).destroy(); } catch {}
        try { passthrough.destroy(); } catch {}
      });
    });
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
