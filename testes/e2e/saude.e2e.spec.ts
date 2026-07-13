import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { construirApp } from '../../src/main.js';
import type { Config } from '../../src/compartilhado/config.js';

const configTeste: Config = {
  nodeEnv: 'test',
  porta: 3333,
  corsOrigens: ['http://localhost:3000'],
  jwtSecret: 'segredo-de-teste',
  jwtExpiracao: '15m',
  databaseUrl: 'postgresql://x:y@localhost:5432/nexdo',
  mongodbUri: 'mongodb://x:y@localhost:27017/nexdo_audit?authSource=admin',
};

describe('Funcionalidade: Bootstrap da aplicação', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    await app?.close();
  });

  it('deve responder 200 com { status: "ok" } no GET /saude', async () => {
    app = construirApp(configTeste);
    await app.ready();

    const resposta = await app.inject({ method: 'GET', url: '/saude' });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({ status: 'ok' });
  });
});
