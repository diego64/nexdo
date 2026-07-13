// Valores conforme o ENUM task_priority do PostgreSQL (inglês) — nunca traduzir.
export enum PrioridadeTarefa {
  Alta = 'high',
  Media = 'medium',
  Baixa = 'low',
}

export const PRIORIDADE_TAREFA_VALIDAS: readonly PrioridadeTarefa[] = [
  PrioridadeTarefa.Alta,
  PrioridadeTarefa.Media,
  PrioridadeTarefa.Baixa,
];
