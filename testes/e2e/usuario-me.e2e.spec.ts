import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { AppDeTeste } from '../auxiliares/app-teste.js';
import { iniciarAppDeTeste, encerrarAppDeTeste } from '../auxiliares/app-teste.js';
import { bancoDisponivel, truncarTabelas } from '../auxiliares/banco-teste.js';
import { fabricarUsuario, obterToken, auth } from '../auxiliares/fabricas.js';

const disponivel = await bancoDisponivel();

describe.skipIf(!disponivel)('Funcionalidade: Direitos do titular / LGPD (E2E)', () => {
  let ctx: AppDeTeste;

  beforeAll(async () => {
    ctx = await iniciarAppDeTeste();
  });

  beforeEach(async () => {
    await truncarTabelas(ctx.pool);
  });

  afterAll(async () => {
    await encerrarAppDeTeste(ctx);
  });

  it('GET /usuarios/me retorna os próprios dados sem password', async () => {
    await fabricarUsuario(ctx.pool, { name: 'Bia', email: 'bia@x.com', role: 'member' });
    const token = await obterToken(ctx.app, 'bia@x.com');

    const resp = await ctx.app.inject({ method: 'GET', url: '/usuarios/me', headers: auth(token) });

    expect(resp.statusCode).toBe(200);
    const corpo = resp.json();
    expect(corpo).toMatchObject({ name: 'Bia', email: 'bia@x.com', role: 'member' });
    expect(corpo).not.toHaveProperty('password');
  });

  it('PATCH /usuarios/me com e-mail já usado → 409', async () => {
    await fabricarUsuario(ctx.pool, { email: 'ocupado@x.com', role: 'member' });
    await fabricarUsuario(ctx.pool, { email: 'bia@x.com', role: 'member' });
    const token = await obterToken(ctx.app, 'bia@x.com');

    const resp = await ctx.app.inject({
      method: 'PATCH',
      url: '/usuarios/me',
      headers: auth(token),
      payload: { email: 'ocupado@x.com' },
    });

    expect(resp.statusCode).toBe(409);
  });

  it('DELETE /usuarios/me anonimiza, preserva histórico e impede novo login', async () => {
    // admin cria time + tarefa; titular (member) recebe a tarefa e uma mudança de status
    await fabricarUsuario(ctx.pool, { email: 'admin@x.com', role: 'admin' });
    const titularId = await fabricarUsuario(ctx.pool, { email: 'titular@x.com', role: 'member' });
    const tokenAdmin = await obterToken(ctx.app, 'admin@x.com');
    const tokenTitular = await obterToken(ctx.app, 'titular@x.com');

    const time = (
      await ctx.app.inject({ method: 'POST', url: '/times', headers: auth(tokenAdmin), payload: { name: 'T' } })
    ).json();
    await ctx.app.inject({
      method: 'POST',
      url: `/times/${time.id}/membros`,
      headers: auth(tokenAdmin),
      payload: { user_id: titularId },
    });
    const tarefa = (
      await ctx.app.inject({
        method: 'POST',
        url: '/tarefas',
        headers: auth(tokenAdmin),
        payload: { title: 'X', team_id: time.id, assigned_to: titularId },
      })
    ).json();
    // A mudança de status é feita pelo próprio titular (tarefa atribuída a ele) →
    // tasks_history.changed_by = titularId, o que queremos ver preservado.
    await ctx.app.inject({
      method: 'PUT',
      url: `/tarefas/${tarefa.id}`,
      headers: auth(tokenTitular),
      payload: { status: 'in_progress' },
    });

    // titular exerce o direito de eliminação
    const del = await ctx.app.inject({
      method: 'DELETE',
      url: '/usuarios/me',
      headers: auth(tokenTitular),
    });
    expect(del.statusCode).toBe(204);

    // dados anonimizados e irreversíveis
    const { rows: u } = await ctx.pool.query<{ name: string; email: string }>(
      'SELECT name, email FROM users WHERE id = $1',
      [titularId],
    );
    expect(u[0].name).toBe('Usuário anonimizado');
    expect(u[0].email).toMatch(/^anonimizado\+.+@invalido$/);

    // tarefa e histórico preservados
    const { rows: t } = await ctx.pool.query('SELECT id FROM tasks WHERE id = $1', [tarefa.id]);
    expect(t).toHaveLength(1);
    const { rows: h } = await ctx.pool.query('SELECT id FROM tasks_history WHERE changed_by = $1', [
      titularId,
    ]);
    expect(h.length).toBeGreaterThanOrEqual(1);

    // login com o e-mail antigo não funciona mais
    const login = await ctx.app.inject({
      method: 'POST',
      url: '/sessoes',
      payload: { email: 'titular@x.com', password: 'senha1234' },
    });
    expect(login.statusCode).toBe(401);
  });
});
