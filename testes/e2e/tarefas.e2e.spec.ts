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

describe.skipIf(!disponivel)('Funcionalidade: Tarefas (E2E)', () => {
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
    const memberA = await criarUsuarioDireto(pool, { email: 'a@x.com', role: 'member' });
    const memberB = await criarUsuarioDireto(pool, { email: 'b@x.com', role: 'member' });
    const semTime = await criarUsuarioDireto(pool, { email: 'c@x.com', role: 'member' });

    const tokenAdmin = await obterToken(app, 'admin@x.com');
    const tokenA = await obterToken(app, 'a@x.com');

    // team1 = { A, B } ; team2 = { B }
    const team1 = (
      await app.inject({ method: 'POST', url: '/times', headers: auth(tokenAdmin), payload: { name: 'T1' } })
    ).json();
    const team2 = (
      await app.inject({ method: 'POST', url: '/times', headers: auth(tokenAdmin), payload: { name: 'T2' } })
    ).json();
    for (const [time, user] of [
      [team1.id, memberA],
      [team1.id, memberB],
      [team2.id, memberB],
    ] as const) {
      await app.inject({
        method: 'POST',
        url: `/times/${time}/membros`,
        headers: auth(tokenAdmin),
        payload: { user_id: user },
      });
    }

    return { tokenAdmin, tokenA, memberA, memberB, semTime, team1: team1.id, team2: team2.id };
  }

  it('member cria tarefa no próprio time → 201', async () => {
    const { tokenA, team1 } = await preparar();
    const resp = await app.inject({
      method: 'POST',
      url: '/tarefas',
      headers: auth(tokenA),
      payload: { title: 'Fazer', team_id: team1 },
    });
    expect(resp.statusCode).toBe(201);
    expect(resp.json()).toMatchObject({ title: 'Fazer', team_id: team1, status: 'pending' });
  });

  it('member cria tarefa em time alheio → 403', async () => {
    const { tokenA, team2 } = await preparar();
    const resp = await app.inject({
      method: 'POST',
      url: '/tarefas',
      headers: auth(tokenA),
      payload: { title: 'X', team_id: team2 },
    });
    expect(resp.statusCode).toBe(403);
  });

  it('member edita tarefa de outro usuário → 403', async () => {
    const { tokenAdmin, tokenA, memberB, team1 } = await preparar();
    const tarefa = (
      await app.inject({
        method: 'POST',
        url: '/tarefas',
        headers: auth(tokenAdmin),
        payload: { title: 'Da B', team_id: team1, assigned_to: memberB },
      })
    ).json();

    const resp = await app.inject({
      method: 'PUT',
      url: `/tarefas/${tarefa.id}`,
      headers: auth(tokenA),
      payload: { title: 'Invasão' },
    });
    expect(resp.statusCode).toBe(403);
  });

  it('admin atribui tarefa a usuário fora do time → 400', async () => {
    const { tokenAdmin, semTime, team1 } = await preparar();
    const tarefa = (
      await app.inject({
        method: 'POST',
        url: '/tarefas',
        headers: auth(tokenAdmin),
        payload: { title: 'T', team_id: team1 },
      })
    ).json();

    const resp = await app.inject({
      method: 'PATCH',
      url: `/tarefas/${tarefa.id}/atribuir`,
      headers: auth(tokenAdmin),
      payload: { user_id: semTime },
    });
    expect(resp.statusCode).toBe(400);
  });

  it('filtro por status e prioridade retorna só o correspondente', async () => {
    const { tokenAdmin, team1 } = await preparar();
    await app.inject({
      method: 'POST',
      url: '/tarefas',
      headers: auth(tokenAdmin),
      payload: { title: 'Alvo', team_id: team1, status: 'pending', priority: 'high' },
    });
    await app.inject({
      method: 'POST',
      url: '/tarefas',
      headers: auth(tokenAdmin),
      payload: { title: 'Ruído', team_id: team1, status: 'completed', priority: 'low' },
    });

    const resp = await app.inject({
      method: 'GET',
      url: '/tarefas?status=pending&prioridade=high',
      headers: auth(tokenAdmin),
    });
    expect(resp.statusCode).toBe(200);
    const { dados } = resp.json();
    expect(dados).toHaveLength(1);
    expect(dados[0]).toMatchObject({ title: 'Alvo', status: 'pending', priority: 'high' });
  });

  it('member lista apenas tarefas dos seus times', async () => {
    const { tokenAdmin, tokenA, team1, team2 } = await preparar();
    await app.inject({
      method: 'POST',
      url: '/tarefas',
      headers: auth(tokenAdmin),
      payload: { title: 'No time do A', team_id: team1 },
    });
    await app.inject({
      method: 'POST',
      url: '/tarefas',
      headers: auth(tokenAdmin),
      payload: { title: 'Fora do A', team_id: team2 },
    });

    const resp = await app.inject({ method: 'GET', url: '/tarefas', headers: auth(tokenA) });
    expect(resp.statusCode).toBe(200);
    const { dados } = resp.json();
    expect(dados).toHaveLength(1);
    expect(dados[0].team_id).toBe(team1);
  });
});
