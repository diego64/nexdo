import { describe, it, expect, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import { construirApp } from '../../src/main.js';
import type { Config } from '../../src/compartilhado/config.js';

const configTeste: Config = {
  nodeEnv: 'test',
  porta: 3333,
  corsOrigens: ['http://localhost:3000'],
  jwtSecret: 'segredo-de-teste',
  jwtExpiracao: '15m',
  databaseUrl: 'postgresql://x:y@localhost:5432/nexdo',
  mongodbUri: 'mongodb://x:y@localhost:27017/nexdo_audit',
};

describe('Segurança: cabeçalhos (helmet)', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    await app?.close();
  });

  it('aplica cabeçalhos de segurança do helmet nas respostas', async () => {
    app = construirApp(configTeste);
    await app.ready();

    const resp = await app.inject({ method: 'GET', url: '/saude' });

    expect(resp.headers['x-content-type-options']).toBe('nosniff');
    expect(resp.headers['x-frame-options']).toBeDefined();
  });
});

describe('Segurança: rate limiting (@fastify/rate-limit)', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    await app?.close();
  });

  it('retorna 429 ao exceder o limite configurado', async () => {
    app = Fastify();
    await app.register(fastifyRateLimit, { max: 2, timeWindow: '1 minute' });
    app.get('/ping', async () => ({ ok: true }));
    await app.ready();

    const r1 = await app.inject({ method: 'GET', url: '/ping' });
    const r2 = await app.inject({ method: 'GET', url: '/ping' });
    const r3 = await app.inject({ method: 'GET', url: '/ping' });

    expect(r1.statusCode).toBe(200);
    expect(r2.statusCode).toBe(200);
    expect(r3.statusCode).toBe(429);
  });
});
