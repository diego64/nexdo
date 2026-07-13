import type { PrioridadeTarefa } from '../enums/prioridade-tarefa.js';
import type { StatusTarefa } from '../enums/status-tarefa.js';

export interface PropsTarefa {
  id: number;
  title: string;
  description: string | null;
  status: StatusTarefa;
  priority: PrioridadeTarefa;
  assignedTo: number | null;
  teamId: number;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface TarefaPublica {
  id: number;
  title: string;
  description: string | null;
  status: StatusTarefa;
  priority: PrioridadeTarefa;
  assigned_to: number | null;
  team_id: number;
}

export class Tarefa {
  readonly id: number;
  readonly title: string;
  readonly description: string | null;
  readonly status: StatusTarefa;
  readonly priority: PrioridadeTarefa;
  readonly assignedTo: number | null;
  readonly teamId: number;
  readonly criadoEm: Date;
  readonly atualizadoEm: Date;

  constructor(props: PropsTarefa) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.status = props.status;
    this.priority = props.priority;
    this.assignedTo = props.assignedTo;
    this.teamId = props.teamId;
    this.criadoEm = props.criadoEm;
    this.atualizadoEm = props.atualizadoEm;
  }

  paraResposta(): TarefaPublica {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      assigned_to: this.assignedTo,
      team_id: this.teamId,
    };
  }
}
