import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/index';
import { PassThrough } from 'stream';

function createDockerMock(overrides: Record<string, any> = {}) {
  const containerMock = (id: string) => ({
    inspect: async () => ({ Id: id, Name: `/${id}` }),
    start: async () => {},
    stop: async (_opts?: any) => {},
    restart: async (_opts?: any) => {},
    kill: async (_opts?: any) => {},
    remove: async (_opts?: any) => {},
    stats: async (_opts?: any) => new PassThrough(),
    logs: async (_opts?: any) => new PassThrough(),
    modem: { demuxStream: (_s: any, _o: any, _e: any) => {} },
  });

  return {
    listContainers: async () => [{ Id: 'abc' }],
    getContainer: (id: string) => containerMock(id),
    pruneContainers: async () => ({ ContainersDeleted: [], SpaceReclaimed: 0 }),
    ...overrides,
  };
}

describe('containers positive paths (SAFE_MODE off)', () => {
  let server: any;

  beforeAll(async () => {
    process.env.SAFE_MODE = 'false';
    server = await buildServer({ docker: createDockerMock() });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
    delete process.env.SAFE_MODE;
  });

  it('gets container detail', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/containers/abc' });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
  });

  it('starts, stops, restarts, kills, and removes a container', async () => {
    const id = 'abc';
    const start = await server.inject({ method: 'POST', url: `/api/containers/${id}/start` });
    expect(start.statusCode).toBe(200);

    const stop = await server.inject({ method: 'POST', url: `/api/containers/${id}/stop`, payload: { t: 1 } });
    expect(stop.statusCode).toBe(200);

    const restart = await server.inject({ method: 'POST', url: `/api/containers/${id}/restart`, payload: { t: 1 } });
    expect(restart.statusCode).toBe(200);

    const kill = await server.inject({ method: 'POST', url: `/api/containers/${id}/kill`, payload: { signal: 'SIGTERM' } });
    expect(kill.statusCode).toBe(200);

    const remove = await server.inject({ method: 'DELETE', url: `/api/containers/${id}?force=true&v=true&link=false` });
    expect(remove.statusCode).toBe(200);
  });

  it('prunes containers', async () => {
    const res = await server.inject({ method: 'POST', url: '/api/containers/prune', payload: { filters: {} } });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
  });
});
