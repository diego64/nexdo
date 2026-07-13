import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import { construirApp } from '../../src/main.js';
import { carregarConfig } from '../../src/compartilhado/config.js';
import { fecharPool } from '../../src/infraestrutura/banco/postgres/conexao.js';
import { migrar } from '../../scripts/migrar.js';
import { obterPoolTeste, bancoDisponivel, truncarTabelas } from '../auxiliares/banco-teste.js';

const disponivel = await bancoDisponivel();

const usuarioValido = { name: 'Carla', email: 'carla@nexdo.local', password: 'senha1234' };

describe.skipIf(!disponivel)('Funcionalidade: Autenticação (E2E)', () => {
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
  });

  it('deve cadastrar usuário retornando 201 com role member e sem password', async () => {
    const resp = await app.inject({ method: 'POST', url: '/usuarios', payload: usuarioValido });

    expect(resp.statusCode).toBe(201);
    const corpo = resp.json();
    expect(corpo).toMatchObject({ name: 'Carla', email: 'carla@nexdo.local', role: 'member' });
    expect(corpo).not.toHaveProperty('password');
    expect(corpo.id).toBeTypeOf('number');
  });

  it('deve retornar 409 para e-mail duplicado', async () => {
    await app.inject({ method: 'POST', url: '/usuarios', payload: usuarioValido });
    const resp = await app.inject({ method: 'POST', url: '/usuarios', payload: usuarioValido });

    expect(resp.statusCode).toBe(409);
    expect(resp.json().erro.codigo).toBe('conflito');
  });

  it('deve retornar 400 para payload com campo extra (mass assignment)', async () => {
    const resp = await app.inject({
      method: 'POST',
      url: '/usuarios',
      payload: { ...usuarioValido, role: 'admin' },
    });

    expect(resp.statusCode).toBe(400);
  });

  it('deve logar com sucesso retornando token JWT', async () => {
    await app.inject({ method: 'POST', url: '/usuarios', payload: usuarioValido });

    const resp = await app.inject({
      method: 'POST',
      url: '/sessoes',
      payload: { email: usuarioValido.email, password: usuarioValido.password },
    });

    expect(resp.statusCode).toBe(200);
    const corpo = resp.json();
    expect(typeof corpo.token).toBe('string');
    expect(corpo.token.split('.')).toHaveLength(3); // header.payload.signature
    expect(corpo.usuario).toMatchObject({ email: usuarioValido.email, role: 'member' });
  });

  it('deve retornar 401 genérico para senha incorreta', async () => {
    await app.inject({ method: 'POST', url: '/usuarios', payload: usuarioValido });

    const resp = await app.inject({
      method: 'POST',
      url: '/sessoes',
      payload: { email: usuarioValido.email, password: 'errada' },
    });

    expect(resp.statusCode).toBe(401);
    expect(resp.json().erro.codigo).toBe('nao_autorizado');
  });
});
