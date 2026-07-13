import type { StatusTarefa } from '../enums/status-tarefa.js';

export interface PropsHistoricoTarefa {
  id: number;
  taskId: number;
  changedBy: number;
  oldStatus: StatusTarefa;
  newStatus: StatusTarefa;
  changedAt: Date;
}

export interface HistoricoTarefaPublico {
  id: number;
  task_id: number;
  changed_by: number;
  old_status: StatusTarefa;
  new_status: StatusTarefa;
  changed_at: Date;
}

export class HistoricoTarefa {
  readonly id: number;
  readonly taskId: number;
  readonly changedBy: number;
  readonly oldStatus: StatusTarefa;
  readonly newStatus: StatusTarefa;
  readonly changedAt: Date;

  constructor(props: PropsHistoricoTarefa) {
    this.id = props.id;
    this.taskId = props.taskId;
    this.changedBy = props.changedBy;
    this.oldStatus = props.oldStatus;
    this.newStatus = props.newStatus;
    this.changedAt = props.changedAt;
  }

  paraResposta(): HistoricoTarefaPublico {
    return {
      id: this.id,
      task_id: this.taskId,
      changed_by: this.changedBy,
      old_status: this.oldStatus,
      new_status: this.newStatus,
      changed_at: this.changedAt,
    };
  }
}
