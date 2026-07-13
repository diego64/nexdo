import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { Pool } from 'pg';
import { PgTarefaRepositorio } from '../../src/infraestrutura/banco/postgres/pg-tarefa.repositorio.js';
import { PgHistoricoTarefaRepositorio } from '../../src/infraestrutura/banco/postgres/pg-historico-tarefa.repositorio.js';
import { StatusTarefa } from '../../src/dominio/enums/status-tarefa.js';
import { PrioridadeTarefa } from '../../src/dominio/enums/prioridade-tarefa.js';
import { migrar } from '../../scripts/migrar.js';
import { obterPoolTeste, bancoDisponivel, truncarTabelas } from '../auxiliares/banco-teste.js';
import { criarUsuarioDireto } from '../auxiliares/fabricas.js';

const disponivel = await bancoDisponivel();

const dados = (status: StatusTarefa) => ({
  title: 'X',
  description: null,
  status,
  priority: PrioridadeTarefa.Media,
});

describe.skipIf(!disponivel)('Funcionalidade: Histórico transacional (integração)', () => {
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

  async function semear(): Promise<{ userId: number; taskId: number }> {
    const userId = await criarUsuarioDireto(pool, { email: 'u@x.com', role: 'member' });
    const { rows: t } = await pool.query<{ id: number }>(
      `INSERT INTO teams (name) VALUES ('T') RETURNING id`,
    );
    const { rows: tk } = await pool.query<{ id: number }>(
      `INSERT INTO tasks (title, team_id) VALUES ('X', $1) RETURNING id`,
      [t[0].id],
    );
    return { userId, taskId: tk[0].id };
  }

  it('mudança de status gera 1 registro correto em tasks_history', async () => {
    const { userId, taskId } = await semear();
    const tarefas = new PgTarefaRepositorio(pool);

    await tarefas.editar(taskId, dados(StatusTarefa.EmProgresso), {
      changedBy: userId,
      oldStatus: StatusTarefa.Pendente,
      newStatus: StatusTarefa.EmProgresso,
    });

    const linhas = await new PgHistoricoTarefaRepositorio(pool).listarPorTarefa(taskId);
    expect(linhas).toHaveLength(1);
    expect(linhas[0].oldStatus).toBe(StatusTarefa.Pendente);
    expect(linhas[0].newStatus).toBe(StatusTarefa.EmProgresso);
    expect(linhas[0].changedBy).toBe(userId);
  });

  it('edição sem mudança de status NÃO gera histórico', async () => {
    const { taskId } = await semear();
    const tarefas = new PgTarefaRepositorio(pool);

    await tarefas.editar(taskId, { ...dados(StatusTarefa.Pendente), title: 'Novo título' });

    const linhas = await new PgHistoricoTarefaRepositorio(pool).listarPorTarefa(taskId);
    expect(linhas).toHaveLength(0);
  });

  it('atomicidade: falha no INSERT do histórico faz ROLLBACK do status', async () => {
    const { taskId } = await semear();
    const tarefas = new PgTarefaRepositorio(pool);
    const changedByInexistente = 999999; // viola a FK de tasks_history.changed_by

    await expect(
      tarefas.editar(taskId, dados(StatusTarefa.Concluida), {
        changedBy: changedByInexistente,
        oldStatus: StatusTarefa.Pendente,
        newStatus: StatusTarefa.Concluida,
      }),
    ).rejects.toThrow();

    const { rows } = await pool.query<{ status: string }>('SELECT status FROM tasks WHERE id = $1', [
      taskId,
    ]);
    expect(rows[0].status).toBe(StatusTarefa.Pendente); // rollback: status inalterado
  });

  it('consulta retorna registros ordenados do mais recente ao mais antigo', async () => {
    const { userId, taskId } = await semear();
    const tarefas = new PgTarefaRepositorio(pool);

    const transicoes: [StatusTarefa, StatusTarefa][] = [
      [StatusTarefa.Pendente, StatusTarefa.EmProgresso],
      [StatusTarefa.EmProgresso, StatusTarefa.Concluida],
      [StatusTarefa.Concluida, StatusTarefa.Pendente],
    ];
    for (const [antigo, novo] of transicoes) {
      await tarefas.editar(taskId, dados(novo), {
        changedBy: userId,
        oldStatus: antigo,
        newStatus: novo,
      });
    }

    const linhas = await new PgHistoricoTarefaRepositorio(pool).listarPorTarefa(taskId);
    expect(linhas).toHaveLength(3);
    expect(linhas[0].newStatus).toBe(StatusTarefa.Pendente); // mais recente
    expect(linhas[2].newStatus).toBe(StatusTarefa.EmProgresso); // mais antiga
  });
});
