// Valores conforme o ENUM task_status do PostgreSQL (inglês) — nunca traduzir.
export enum StatusTarefa {
  Pendente = 'pending',
  EmProgresso = 'in_progress',
  Concluida = 'completed',
}

export const STATUS_TAREFA_VALIDOS: readonly StatusTarefa[] = [
  StatusTarefa.Pendente,
  StatusTarefa.EmProgresso,
  StatusTarefa.Concluida,
];
