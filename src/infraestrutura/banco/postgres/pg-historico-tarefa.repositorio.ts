import type { Pool } from 'pg';
import { HistoricoTarefa } from '../../../dominio/entidades/historico-tarefa.entidade.js';
import type { StatusTarefa } from '../../../dominio/enums/status-tarefa.js';
import type { IHistoricoTarefaRepositorio } from '../../../dominio/repositorios/historico-tarefa.repositorio.js';

interface LinhaHistorico {
  id: number;
  task_id: number;
  changed_by: number;
  old_status: StatusTarefa;
  new_status: StatusTarefa;
  changed_at: Date;
}

function paraEntidade(linha: LinhaHistorico): HistoricoTarefa {
  return new HistoricoTarefa({
    id: linha.id,
    taskId: linha.task_id,
    changedBy: linha.changed_by,
    oldStatus: linha.old_status,
    newStatus: linha.new_status,
    changedAt: linha.changed_at,
  });
}

export class PgHistoricoTarefaRepositorio implements IHistoricoTarefaRepositorio {
  constructor(private readonly pool: Pool) {}

  async listarPorTarefa(taskId: number): Promise<HistoricoTarefa[]> {
    const { rows } = await this.pool.query<LinhaHistorico>(
      'SELECT * FROM tasks_history WHERE task_id = $1 ORDER BY changed_at DESC, id DESC',
      [taskId],
    );
    return rows.map(paraEntidade);
  }
}
