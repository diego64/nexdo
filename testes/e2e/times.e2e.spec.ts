import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import { construirApp } from '../../src/main.js';
import { carregarConfig } from '../../src/compartilhado/config.js';
import { fecharPool } from '../../src/infraestrutura/banco/postgres/conexao.js';
import { fecharMongo } from '../../src/infraestrutura/banco/mongo/conexao.js';
import { migrar } from '../../scripts/migrar.js';
import { obterPoolTeste, bancoDisponivel, truncarTabelas } from '../auxiliares/banco-teste.js';
import { criarUsuarioDireto, obterToken, auth } from '../auxiliares/fabricas.js';

const disponivel = await bancoDisponivel();

describe.skipIf(!disponivel)('Funcionalidade: Gestão de times (E2E)', () => {
  let app: FastifyInstance;
  let pool: Pool;

  beforeAll(async () => {
    pool = obterPoolTeste();
    await migrar(pool);
    app = construirApp(carregarConfig());
    await app.ready();
  });

  beforeEach(async () => {
    await truncarTabelas(pool);
  });

  afterAll(async () => {
    await app?.close();
    await pool?.end();
    await fecharPool();
    await fecharMongo();
  });

  async function preparar() {
    await criarUsuarioDireto(pool, { email: 'admin@x.com', role: 'admin' });
    const memberId = await criarUsuarioDireto(pool, { email: 'membro@x.com', role: 'member' });
    const tokenAdmin = await obterToken(app, 'admin@x.com');
    const tokenMembro = await obterToken(app, 'membro@x.com');
    return { memberId, tokenAdmin, tokenMembro };
  }

  it('deve permitir admin criar time (201)', async () => {
    const { tokenAdmin } = await preparar();
    const resp = await app.inject({
      method: 'POST',
      url: '/times',
      headers: auth(tokenAdmin),
      payload: { name: 'Plataforma' },
    });
    expect(resp.statusCode).toBe(201);
    expect(resp.json()).toMatchObject({ name: 'Plataforma' });
  });

  it('deve retornar 403 quando member tenta criar time', async () => {
    const { tokenMembro } = await preparar();
    const resp = await app.inject({
      method: 'POST',
      url: '/times',
      headers: auth(tokenMembro),
      payload: { name: 'X' },
    });
    expect(resp.statusCode).toBe(403);
  });

  it('deve retornar 401 ao acessar rota protegida sem token', async () => {
    const resp = await app.inject({ method: 'GET', url: '/times' });
    expect(resp.statusCode).toBe(401);
  });

  it('deve retornar 409 ao adicionar membro duplicado', async () => {
    const { tokenAdmin, memberId } = await preparar();
    const time = (
      await app.inject({
        method: 'POST',
        url: '/times',
        headers: auth(tokenAdmin),
        payload: { name: 'Time 1' },
      })
    ).json();

    const corpo = { user_id: memberId };
    await app.inject({
      method: 'POST',
      url: `/times/${time.id}/membros`,
      headers: auth(tokenAdmin),
      payload: corpo,
    });
    const dup = await app.inject({
      method: 'POST',
      url: `/times/${time.id}/membros`,
      headers: auth(tokenAdmin),
      payload: corpo,
    });

    expect(dup.statusCode).toBe(409);
  });

  it('deve permitir member listar membros do próprio time (200)', async () => {
    const { tokenAdmin, tokenMembro, memberId } = await preparar();
    const time = (
      await app.inject({
        method: 'POST',
        url: '/times',
        headers: auth(tokenAdmin),
        payload: { name: 'Time 1' },
      })
    ).json();
    await app.inject({
      method: 'POST',
      url: `/times/${time.id}/membros`,
      headers: auth(tokenAdmin),
      payload: { user_id: memberId },
    });

    const resp = await app.inject({
      method: 'GET',
      url: `/times/${time.id}/membros`,
      headers: auth(tokenMembro),
    });

    expect(resp.statusCode).toBe(200);
    expect(resp.json()).toEqual(
      expect.arrayContaining([expect.objectContaining({ user_id: memberId })]),
    );
  });

  it('deve retornar 403 quando member lista membros de time ao qual não pertence', async () => {
    const { tokenAdmin, tokenMembro } = await preparar();
    const outro = (
      await app.inject({
        method: 'POST',
        url: '/times',
        headers: auth(tokenAdmin),
        payload: { name: 'Outro' },
      })
    ).json();

    const resp = await app.inject({
      method: 'GET',
      url: `/times/${outro.id}/membros`,
      headers: auth(tokenMembro),
    });

    expect(resp.statusCode).toBe(403);
  });
});
