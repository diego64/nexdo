import type { Tarefa } from '../entidades/tarefa.entidade.js';
import type { PrioridadeTarefa } from '../enums/prioridade-tarefa.js';
import type { StatusTarefa } from '../enums/status-tarefa.js';

export interface NovaTarefa {
  title: string;
  description: string | null;
  status: StatusTarefa;
  priority: PrioridadeTarefa;
  assignedTo: number | null;
  teamId: number;
}

export interface DadosTarefa {
  title: string;
  description: string | null;
  status: StatusTarefa;
  priority: PrioridadeTarefa;
}

/** Transição de status a registrar em tasks_history, na MESMA transação. */
export interface TransicaoStatus {
  changedBy: number;
  oldStatus: StatusTarefa;
  newStatus: StatusTarefa;
}

export interface FiltrosTarefa {
  status?: StatusTarefa;
  prioridade?: PrioridadeTarefa;
  time?: number;
}

export interface PaginaTarefas {
  dados: Tarefa[];
  total: number;
  pagina: number;
}

export interface ITarefaRepositorio {
  criar(dados: NovaTarefa): Promise<Tarefa>;
  buscarPorId(id: number): Promise<Tarefa | null>;
  /**
   * Lista com filtros. `equipesPermitidas` restringe por time (member); `null`
   * = sem restrição de escopo (admin).
   */
  listar(
    filtros: FiltrosTarefa,
    equipesPermitidas: number[] | null,
    pagina: number,
    limite: number,
  ): Promise<PaginaTarefas>;
  /**
   * Edita a tarefa. Se `transicao` for informada (mudança de status), o UPDATE
   * de `tasks` e o INSERT em `tasks_history` ocorrem na MESMA transação PG.
   */
  editar(id: number, dados: DadosTarefa, transicao?: TransicaoStatus): Promise<Tarefa | null>;
  excluir(id: number): Promise<boolean>;
  atribuir(id: number, assignedTo: number): Promise<Tarefa | null>;
}
