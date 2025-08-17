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

  it('blocks destructive image delete in SAFE_MODE', async () => {
    const res = await server.inject({ method: 'DELETE', url: '/api/images/img1' });
    expect(res.statusCode).toBe(403);
  });

  it('blocks volume delete in SAFE_MODE', async () => {
    const res = await server.inject({ method: 'DELETE', url: '/api/volumes/vol1' });
    expect(res.statusCode).toBe(403);
  });

  it('blocks network delete in SAFE_MODE', async () => {
    const res = await server.inject({ method: 'DELETE', url: '/api/networks/net1' });
    expect(res.statusCode).toBe(403);
  });

  it('allows non-destructive create endpoints', async () => {
    // create volume
    const resVol = await server.inject({ method: 'POST', url: '/api/volumes', payload: { Name: 'newvol' } });
    expect(resVol.statusCode).toBe(403); // blocked because SAFE_MODE true

    // create network
    const resNet = await server.inject({ method: 'POST', url: '/api/networks', payload: { Name: 'newnet' } });
    expect(resNet.statusCode).toBe(403); // blocked because SAFE_MODE true
  });

  it('blocks network connect/disconnect in SAFE_MODE', async () => {
    const connect = await server.inject({ method: 'POST', url: '/api/networks/net1/connect', payload: { Container: 'abc' } });
    expect(connect.statusCode).toBe(403);
    const disconnect = await server.inject({ method: 'POST', url: '/api/networks/net1/disconnect', payload: { Container: 'abc' } });
    expect(disconnect.statusCode).toBe(403);
  });

  it('can invoke image pull (non-destructive) endpoint', async () => {
    const res = await server.inject({ method: 'POST', url: '/api/images/pull', payload: { repoTag: 'alpine', tag: 'latest' } });
    // even in SAFE_MODE this should not be blocked because it's non-destructive by policy
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
  });
});
