import { z } from 'zod';
import { StatusTarefa } from '../../../dominio/enums/status-tarefa.js';
import { PrioridadeTarefa } from '../../../dominio/enums/prioridade-tarefa.js';

// Edição parcial: campos ausentes mantêm o valor atual (merge no caso de uso).
export const editarTarefaEsquema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).nullish(),
    status: z.nativeEnum(StatusTarefa).optional(),
    priority: z.nativeEnum(PrioridadeTarefa).optional(),
  })
  .strict();

export type EditarTarefaDTO = z.infer<typeof editarTarefaEsquema>;
