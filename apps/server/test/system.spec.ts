import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/index';

function createDockerMock(overrides: Record<string, any> = {}) {
  return {
    info: async () => ({ ID: 'x', ServerVersion: '24.0' }),
    df: async () => ({ LayersSize: 123, Images: [], Containers: [] }),
    pruneContainers: async () => ({ ContainersDeleted: [], SpaceReclaimed: 0 }),
    pruneImages: async () => ({ ImagesDeleted: [], SpaceReclaimed: 0 }),
    pruneVolumes: async () => ({ VolumesDeleted: [], SpaceReclaimed: 0 }),
    pruneNetworks: async () => ({ NetworksDeleted: [], SpaceReclaimed: 0 }),
    ...overrides,
  };
}

describe('system routes', () => {
  let server: any;

  beforeAll(async () => {
    server = await buildServer({ docker: createDockerMock() });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('GET /api/system/df returns disk usage', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/system/df' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeTruthy();
  });

  it('POST /api/system/prune aggregates results', async () => {
    const res = await server.inject({ method: 'POST', url: '/api/system/prune', payload: { filters: {} } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('containers');
    expect(body.data).toHaveProperty('images');
    expect(body.data).toHaveProperty('volumes');
    expect(body.data).toHaveProperty('networks');
  });
});
