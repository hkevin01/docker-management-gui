import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/index.js';

describe('server smoke', () => {
  let server: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => {
    const dockerMock = {
      ping: async () => undefined,
      info: async () => ({
        ID: 'mock',
        Name: 'mock-host',
        ServerVersion: '24.0.0',
        OperatingSystem: 'MockOS',
      }),
      df: async () => ({
        LayersSize: 0,
        Images: [],
        Containers: [],
        Volumes: [],
        BuildCache: [],
      }),
      pruneContainers: async () => ({}),
      pruneImages: async () => ({}),
      pruneVolumes: async () => ({}),
      pruneNetworks: async () => ({}),
    };
    server = await buildServer({ docker: dockerMock });
  });

  afterAll(async () => {
    await server.close();
  });

  it('responds to /api/health', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
  });

  it('responds to /api/system/info', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/system/info' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data).toBeTruthy();
    expect(body.data.ServerVersion).toBe('24.0.0');
  });
});
