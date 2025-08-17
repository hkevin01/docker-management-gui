import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/index';

function createDockerMock(overrides: Record<string, any> = {}) {
  return {
    ping: async () => {},
    info: async () => ({ ServerVersion: '24.0', ID: 'abc' }),
    df: async () => ({ LayersSize: 0 }),
    listContainers: async () => [],
    listImages: async () => [],
    listVolumes: async () => ({ Volumes: [] }),
    listNetworks: async () => [],
    pruneContainers: async () => ({}),
    pruneImages: async () => ({}),
    pruneVolumes: async () => ({}),
    pruneNetworks: async () => ({}),
    getEvents: (_opts: any, cb: any) => cb(null, new (require('stream').PassThrough)()),
    ...overrides,
  };
}

describe('health and basic routes', () => {
  let server: any;

  beforeAll(async () => {
    server = await buildServer({ docker: createDockerMock() });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('GET /api/health returns ok', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
  });

  it('GET /api/system/info returns success', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/system/info' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
  });

  it('GET /metrics exposes prometheus metrics', async () => {
    const res = await server.inject({ method: 'GET', url: '/metrics' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.body).toContain('http_requests_total');
  });
});
