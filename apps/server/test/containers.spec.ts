import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/index';
import { PassThrough } from 'stream';

function createDockerMock(overrides: Record<string, any> = {}) {
  const containerMock = (id: string) => ({
    inspect: async () => ({ Id: id, Name: `/${id}` }),
    start: async () => {},
    stop: async () => {},
    restart: async () => {},
    kill: async () => {},
    remove: async () => {},
    stats: async () => new PassThrough(),
    logs: async () => new PassThrough(),
    modem: { demuxStream: (_s: any, _o: any, _e: any) => {} },
  });

  return {
    listContainers: async () => [{ Id: 'abc' }],
    getContainer: (id: string) => containerMock(id),
    pruneContainers: async () => ({}),
    ...overrides,
  };
}

describe('containers routes', () => {
  let server: any;

  beforeAll(async () => {
    process.env.SAFE_MODE = 'true'; // ensure destructive ops are blocked
    server = await buildServer({ docker: createDockerMock() });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
    delete process.env.SAFE_MODE;
  });

  it('lists containers', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/containers' });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
  });

  it('blocks start in SAFE_MODE', async () => {
    const res = await server.inject({ method: 'POST', url: '/api/containers/abc/start' });
    expect(res.statusCode).toBe(403);
  });
});
