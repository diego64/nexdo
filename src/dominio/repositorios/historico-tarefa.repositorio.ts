import type { HistoricoTarefa } from '../entidades/historico-tarefa.entidade.js';

export interface IHistoricoTarefaRepositorio {
  /** Histórico de mudanças de status da tarefa, ordenado por changed_at DESC. */
  listarPorTarefa(taskId: number): Promise<HistoricoTarefa[]>;
}
