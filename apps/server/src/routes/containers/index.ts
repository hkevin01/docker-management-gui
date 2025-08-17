import { FastifyPluginAsync } from 'fastify';
import { PassThrough } from 'stream';

function assertNotSafeMode(fastify: any) {
  if (process.env.SAFE_MODE === 'true') {
    throw fastify.httpErrors.forbidden('Operation disabled in SAFE_MODE');
  }
}

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
  assertNotSafeMode(fastify);
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
  assertNotSafeMode(fastify);
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
  assertNotSafeMode(fastify);
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
  assertNotSafeMode(fastify);
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
  assertNotSafeMode(fastify);
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
  // Logs streaming via WebSocket
  fastify.get('/:id/logs', { websocket: true }, async (connection, req) => {
    const { id } = req.params as any;
    const q = req.query as any;
    const options: any = {
      follow: q.follow === 'true',
      stdout: q.stdout !== 'false',
      stderr: q.stderr !== 'false',
      since: q.since ? Number(q.since) : undefined,
      until: q.until ? Number(q.until) : undefined,
      timestamps: q.timestamps === 'true',
      tail: q.tail ?? 'all',
    };

    let closed = false;
    (connection as any).socket.on('close', () => { closed = true; });

    const container = fastify.docker.getContainer(id);
    try {
  const logStream: NodeJS.ReadableStream = await (container as any).logs({
        ...options,
        follow: true,
        stdout: true,
        stderr: true,
        timestamps: options.timestamps,
        tail: options.tail,
      });

      // demux stdout/stderr
      const stdout = new PassThrough();
      const stderr = new PassThrough();
      (container as any).modem.demuxStream(logStream, stdout, stderr);

      const send = (prefix: string) => (chunk: Buffer) => {
        if (closed) return;
        if (((connection as any).socket.bufferedAmount as number) > 1_000_000) return;
        try {
          (connection as any).socket.send(`${prefix}${chunk.toString()}`);
        } catch {}
      };

      stdout.on('data', send('OUT '));
      stderr.on('data', send('ERR '));

      const cleanup = () => {
        try { (logStream as any).destroy(); } catch {}
        try { stdout.destroy(); } catch {}
        try { stderr.destroy(); } catch {}
      };
      (connection as any).socket.on('close', cleanup);
      logStream.on('error', cleanup);
      logStream.on('end', cleanup);
    } catch (e) {
      fastify.log.error({ e }, 'logs stream failed');
      try { (connection as any).socket.close(); } catch {}
    }
  });

  // Stats streaming via WebSocket
  fastify.get('/:id/stats', { websocket: true }, async (connection, req) => {
    const { id } = req.params as any;
    const q = req.query as any;
    const stream = q.stream === 'true';

    const container = fastify.docker.getContainer(id);
    try {
  const statsStream: NodeJS.ReadableStream = await (container as any).stats(stream ? { stream: true } : { stream: false });
      const passthrough = new PassThrough();
      statsStream.pipe(passthrough);

      let closed = false;
      (connection as any).socket.on('close', () => { closed = true; });

      passthrough.on('data', (chunk: Buffer) => {
        if (closed) return;
        if (((connection as any).socket.bufferedAmount as number) > 1_000_000) return;
        try { (connection as any).socket.send(chunk.toString()); } catch {}
      });

      const cleanup = () => {
        try { (statsStream as any).destroy(); } catch {}
        try { passthrough.destroy(); } catch {}
      };
      (connection as any).socket.on('close', cleanup);
      statsStream.on('error', cleanup);
      statsStream.on('end', cleanup);
    } catch (e) {
      fastify.log.error({ e }, 'stats stream failed');
      try { (connection as any).socket.close(); } catch {}
    }
  });

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
  assertNotSafeMode(fastify);
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
