import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { Pool } from 'pg';
import { PgUsuarioRepositorio } from '../../src/infraestrutura/banco/postgres/pg-usuario.repositorio.js';
import { PgTarefaRepositorio } from '../../src/infraestrutura/banco/postgres/pg-tarefa.repositorio.js';
import { PgHistoricoTarefaRepositorio } from '../../src/infraestrutura/banco/postgres/pg-historico-tarefa.repositorio.js';
import { StatusTarefa } from '../../src/dominio/enums/status-tarefa.js';
import { PrioridadeTarefa } from '../../src/dominio/enums/prioridade-tarefa.js';
import { migrar } from '../../scripts/migrar.js';
import { obterPoolTeste, bancoDisponivel, truncarTabelas } from '../auxiliares/banco-teste.js';
import { fabricarUsuario, fabricarTime, fabricarTarefa } from '../auxiliares/fabricas.js';

const disponivel = await bancoDisponivel();

describe.skipIf(!disponivel)('LGPD: anonimização preserva histórico (integração)', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = obterPoolTeste();
    await migrar(pool);
  });

  beforeEach(async () => {
    await truncarTabelas(pool);
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('anonimiza o usuário e mantém tasks e tasks_history íntegros', async () => {
    const userId = await fabricarUsuario(pool, { email: 'titular@x.com', role: 'member' });
    const teamId = await fabricarTime(pool, { name: 'T' });
    const taskId = await fabricarTarefa(pool, { teamId, assignedTo: userId });

    // gera uma linha de histórico com changed_by = userId
    await new PgTarefaRepositorio(pool).editar(
      taskId,
      { title: 'X', description: null, status: StatusTarefa.EmProgresso, priority: PrioridadeTarefa.Media },
      { changedBy: userId, oldStatus: StatusTarefa.Pendente, newStatus: StatusTarefa.EmProgresso },
    );

    const anonimizado = await new PgUsuarioRepositorio(pool).anonimizar(userId, {
      name: 'Usuário anonimizado',
      email: 'anonimizado+abc@invalido',
      senhaHash: 'hash',
    });
    expect(anonimizado).toBe(true);

    // usuário permanece (id preservado), com dados anonimizados
    const { rows: u } = await pool.query<{ name: string; email: string }>(
      'SELECT name, email FROM users WHERE id = $1',
      [userId],
    );
    expect(u).toHaveLength(1);
    expect(u[0].name).toBe('Usuário anonimizado');
    expect(u[0].email).toBe('anonimizado+abc@invalido');

    // tarefa e histórico continuam referenciando o id
    const { rows: t } = await pool.query('SELECT id FROM tasks WHERE assigned_to = $1', [userId]);
    expect(t).toHaveLength(1);
    const historico = await new PgHistoricoTarefaRepositorio(pool).listarPorTarefa(taskId);
    expect(historico).toHaveLength(1);
    expect(historico[0].changedBy).toBe(userId);
  });
});
