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

describe.skipIf(!disponivel)('Funcionalidade: Validação de payloads (E2E)', () => {
  let app: FastifyInstance;
  let pool: Pool;
  let tokenAdmin: string;
  let team: number;

  beforeAll(async () => {
    pool = obterPoolTeste();
    await migrar(pool);
    app = construirApp(carregarConfig());
    await app.ready();
  });

  beforeEach(async () => {
    await truncarTabelas(pool);
    await criarUsuarioDireto(pool, { email: 'admin@x.com', role: 'admin' });
    tokenAdmin = await obterToken(app, 'admin@x.com');
    team = (
      await app.inject({ method: 'POST', url: '/times', headers: auth(tokenAdmin), payload: { name: 'T' } })
    ).json().id;
  });

  afterAll(async () => {
    await app?.close();
    await pool?.end();
    await fecharPool();
    await fecharMongo();
  });

  it('POST /tarefas com campo extra → 400 apontando o campo', async () => {
    const resp = await app.inject({
      method: 'POST',
      url: '/tarefas',
      headers: auth(tokenAdmin),
      payload: { title: 'X', team_id: team, hack: true },
    });
    expect(resp.statusCode).toBe(400);
    const corpo = resp.json();
    expect(corpo.erro.codigo).toBe('VALIDACAO');
    expect(JSON.stringify(corpo.erro.detalhes)).toContain('hack');
  });

  it('POST /tarefas com enum de status inválido → 400', async () => {
    const resp = await app.inject({
      method: 'POST',
      url: '/tarefas',
      headers: auth(tokenAdmin),
      payload: { title: 'X', team_id: team, status: 'done' },
    });
    expect(resp.statusCode).toBe(400);
    expect(resp.json().erro.codigo).toBe('VALIDACAO');
  });

  it('POST /usuarios com e-mail malformado → 400 com issue no campo email', async () => {
    const resp = await app.inject({
      method: 'POST',
      url: '/usuarios',
      payload: { name: 'A', email: 'abc', password: 'senha1234' },
    });
    expect(resp.statusCode).toBe(400);
    expect(JSON.stringify(resp.json().erro.detalhes)).toContain('email');
  });

  it('GET /tarefas?limite=9999 → 400 (limite de paginação)', async () => {
    const resp = await app.inject({
      method: 'GET',
      url: '/tarefas?limite=9999',
      headers: auth(tokenAdmin),
    });
    expect(resp.statusCode).toBe(400);
  });

  it('GET /tarefas?limite=50 → 200 (coerção de query)', async () => {
    const resp = await app.inject({
      method: 'GET',
      url: '/tarefas?limite=50&pagina=1',
      headers: auth(tokenAdmin),
    });
    expect(resp.statusCode).toBe(200);
  });
});
