import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/index';

function createDockerMock(overrides: Record<string, any> = {}) {
  return {
    listImages: async () => [{ Id: 'img1' }],
    getImage: (_id: string) => ({ inspect: async () => ({ Id: 'img1' }), remove: async () => ({}) }),
    pruneImages: async () => ({}),

    listVolumes: async () => ({ Volumes: [{ Name: 'vol1' }] }),
    getVolume: (_name: string) => ({ inspect: async () => ({ Name: 'vol1' }), remove: async (_o: any) => {} }),
    createVolume: async (_o: any) => ({ Name: 'volX' }),
    pruneVolumes: async () => ({}),

    listNetworks: async () => [{ Id: 'net1' }],
    getNetwork: (_id: string) => ({ inspect: async () => ({ Id: 'net1' }), remove: async () => {}, connect: async () => {}, disconnect: async () => {} }),
    createNetwork: async (_o: any) => ({ Id: 'netX' }),
    pruneNetworks: async () => ({}),

    pull: (_repoTag: string, _opts: any, cb: any) => cb(null, { on: (_: string, cb2: any) => cb2() }),
    ...overrides,
  };
}

describe('images/volumes/networks routes', () => {
  let server: any;

  beforeAll(async () => {
    process.env.SAFE_MODE = 'true';
    server = await buildServer({ docker: createDockerMock() });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
    delete process.env.SAFE_MODE;
  });

  it('lists images', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/images' });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
  });

  it('lists volumes', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/volumes' });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
  });

  it('lists networks', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/networks' });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
  });
});
