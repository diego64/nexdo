import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Pool } from 'pg';
import { migrar } from '../../scripts/migrar.js';
import { semear } from '../../scripts/seed.js';
import { obterPoolTeste, bancoDisponivel } from '../auxiliares/banco-teste.js';

// Sem PostgreSQL acessível (ex.: sandbox sem Docker), a suíte é pulada.
const disponivel = await bancoDisponivel();

describe.skipIf(!disponivel)('Funcionalidade: Migração do banco', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = obterPoolTeste();
    await migrar(pool); // banco pode não estar vazio; migração é idempotente
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('deve ter as 5 tabelas de domínio após migrar', async () => {
    const { rows } = await pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'`,
    );
    const tabelas = rows.map((r) => r.table_name);
    for (const t of ['users', 'teams', 'team_members', 'tasks', 'tasks_history']) {
      expect(tabelas).toContain(t);
    }
  });

  it('deve criar os ENUMs de domínio', async () => {
    const { rows } = await pool.query<{ typname: string }>(
      `SELECT typname FROM pg_type WHERE typname IN ('user_role','task_status','task_priority')`,
    );
    expect(rows).toHaveLength(3);
  });

  it('deve criar os índices esperados', async () => {
    const { rows } = await pool.query<{ indexname: string }>(
      `SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`,
    );
    const indices = rows.map((r) => r.indexname);
    for (const idx of [
      'idx_team_members_team_id',
      'idx_team_members_user_id',
      'idx_tasks_team_status',
      'idx_tasks_assigned_to',
      'idx_tasks_priority',
      'idx_tasks_history_task_changed',
    ]) {
      expect(indices).toContain(idx);
    }
  });

  it('deve ser idempotente: reexecutar migrar não aplica nada', async () => {
    const novas = await migrar(pool);
    expect(novas).toEqual([]);
  });

  it('deve semear 1 administrador com senha em hash bcrypt', async () => {
    await semear(pool);
    const { rows } = await pool.query<{ role: string; password: string }>(
      `SELECT role, password FROM users WHERE email = 'administrador@nexdo.local'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].role).toBe('admin');
    // Hash bcrypt começa com $2a$/$2b$ e tem 60 chars.
    expect(rows[0].password).toMatch(/^\$2[aby]\$/);
    expect(rows[0].password).toHaveLength(60);
  });
});
