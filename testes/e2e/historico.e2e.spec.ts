import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import { iniciarAppDeTeste, encerrarAppDeTeste } from '../auxiliares/app-teste.js';
import { bancoDisponivel, truncarTabelas } from '../auxiliares/banco-teste.js';
import { fabricarUsuario, obterToken, auth } from '../auxiliares/fabricas.js';

const disponivel = await bancoDisponivel();

describe.skipIf(!disponivel)('Funcionalidade: Histórico de status (E2E)', () => {
  let app: FastifyInstance;
  let pool: Pool;

  beforeAll(async () => {
    ({ app, pool } = await iniciarAppDeTeste());
  });

  beforeEach(async () => {
    await truncarTabelas(pool);
  });

  afterAll(async () => {
    await encerrarAppDeTeste({ app, pool });
  });

  it('GET /tarefas/:id/historico retorna as mudanças de status em ordem DESC', async () => {
    await fabricarUsuario(pool, { email: 'admin@x.com', role: 'admin' });
    const tokenAdmin = await obterToken(app, 'admin@x.com');

    const team = (
      await app.inject({ method: 'POST', url: '/times', headers: auth(tokenAdmin), payload: { name: 'T' } })
    ).json();
    const tarefa = (
      await app.inject({
        method: 'POST',
        url: '/tarefas',
        headers: auth(tokenAdmin),
        payload: { title: 'X', team_id: team.id },
      })
    ).json();

    // pending → in_progress → completed
    await app.inject({
      method: 'PUT',
      url: `/tarefas/${tarefa.id}`,
      headers: auth(tokenAdmin),
      payload: { status: 'in_progress' },
    });
    await app.inject({
      method: 'PUT',
      url: `/tarefas/${tarefa.id}`,
      headers: auth(tokenAdmin),
      payload: { status: 'completed' },
    });
    // edição sem mudança de status não deve adicionar registro
    await app.inject({
      method: 'PUT',
      url: `/tarefas/${tarefa.id}`,
      headers: auth(tokenAdmin),
      payload: { title: 'Renomeada' },
    });

    const resp = await app.inject({
      method: 'GET',
      url: `/tarefas/${tarefa.id}/historico`,
      headers: auth(tokenAdmin),
    });

    expect(resp.statusCode).toBe(200);
    const historico = resp.json();
    expect(historico).toHaveLength(2);
    expect(historico[0]).toMatchObject({ old_status: 'in_progress', new_status: 'completed' });
    expect(historico[1]).toMatchObject({ old_status: 'pending', new_status: 'in_progress' });
  });

  it('member fora do time recebe 403 no histórico', async () => {
    await fabricarUsuario(pool, { email: 'admin@x.com', role: 'admin' });
    await fabricarUsuario(pool, { email: 'forasteiro@x.com', role: 'member' });
    const tokenAdmin = await obterToken(app, 'admin@x.com');
    const tokenForasteiro = await obterToken(app, 'forasteiro@x.com');

    const team = (
      await app.inject({ method: 'POST', url: '/times', headers: auth(tokenAdmin), payload: { name: 'T' } })
    ).json();
    const tarefa = (
      await app.inject({
        method: 'POST',
        url: '/tarefas',
        headers: auth(tokenAdmin),
        payload: { title: 'X', team_id: team.id },
      })
    ).json();

    const resp = await app.inject({
      method: 'GET',
      url: `/tarefas/${tarefa.id}/historico`,
      headers: auth(tokenForasteiro),
    });
    expect(resp.statusCode).toBe(403);
  });
});
