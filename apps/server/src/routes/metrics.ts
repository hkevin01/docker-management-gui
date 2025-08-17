import type { FastifyPluginAsync } from 'fastify';
import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'] as const,
});

register.registerMetric(httpRequestsTotal);

const metricsRoute: FastifyPluginAsync = async (fastify) => {
  // Hook to count requests
  fastify.addHook('onResponse', async (req, reply) => {
    const route = (reply as any).context?.config?.url || (req as any).routerPath || req.url;
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status: String(reply.statusCode),
    });
  });

  fastify.get('/metrics', async (_request, reply) => {
    reply.header('Content-Type', register.contentType);
    const metrics = await register.metrics();
    reply.send(metrics);
  });
};

export { metricsRoute };
