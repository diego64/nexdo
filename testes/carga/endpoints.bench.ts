import { bench, describe, beforeAll, afterAll } from 'vitest';
import type { AppDeTeste } from '../auxiliares/app-teste.js';
import { iniciarAppDeTeste, encerrarAppDeTeste } from '../auxiliares/app-teste.js';
import { bancoDisponivel, truncarTabelas } from '../auxiliares/banco-teste.js';
import { fabricarUsuario, fabricarTime, fabricarTarefa, obterToken, auth } from '../auxiliares/fabricas.js';

const disponivel = await bancoDisponivel();

/**
 * Baseline de carga dos endpoints críticos (rodar `pnpm test:carga`).
 * Metas de referência (ambiente local, single instance):
 *   - POST /sessoes      p95 ≤ 120ms  (dominado por bcrypt.compare custo 10)
 *   - GET  /tarefas      p95 ≤ 25ms
 *   - PUT  /tarefas/:id   p95 ≤ 40ms
 * Regressões acima destes valores devem ser investigadas antes do deploy.
 */
describe.skipIf(!disponivel)('Carga: endpoints críticos', () => {
  let ctx: AppDeTeste;
  let token: string;
  let tarefaId: number;

  beforeAll(async () => {
    ctx = await iniciarAppDeTeste();
    await truncarTabelas(ctx.pool);
    await fabricarUsuario(ctx.pool, { email: 'admin@x.com', role: 'admin' });
    const teamId = await fabricarTime(ctx.pool, { name: 'Carga' });
    tarefaId = await fabricarTarefa(ctx.pool, { teamId, title: 'Bench' });
    token = await obterToken(ctx.app, 'admin@x.com');
  });

  afterAll(async () => {
    await encerrarAppDeTeste(ctx);
  });

  bench('POST /sessoes', async () => {
    await ctx.app.inject({
      method: 'POST',
      url: '/sessoes',
      payload: { email: 'admin@x.com', password: 'senha1234' },
    });
  });

  bench('GET /tarefas', async () => {
    await ctx.app.inject({ method: 'GET', url: '/tarefas', headers: auth(token) });
  });

  bench('PUT /tarefas/:id', async () => {
    await ctx.app.inject({
      method: 'PUT',
      url: `/tarefas/${tarefaId}`,
      headers: auth(token),
      payload: { title: 'Bench atualizada' },
    });
  });
});
