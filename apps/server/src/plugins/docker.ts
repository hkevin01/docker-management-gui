import { FastifyPluginAsync } from 'fastify';
import Docker from 'dockerode';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    docker: Docker;
  }
}

const dockerPlugin: FastifyPluginAsync = async (fastify) => {
  try {
    const docker = new Docker({
      socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
    });

    // Test the connection
    await docker.ping();
    fastify.log.info('✅ Connected to Docker daemon');

    fastify.decorate('docker', docker);

    // Graceful shutdown
    fastify.addHook('onClose', async () => {
      fastify.log.info('Closing Docker connection...');
      // Docker client doesn't need explicit close
    });
  } catch (error) {
    fastify.log.error('❌ Failed to connect to Docker daemon:', error);
    throw error;
  }
};

export default fp(dockerPlugin, {
  name: 'docker',
});

export { dockerPlugin };
