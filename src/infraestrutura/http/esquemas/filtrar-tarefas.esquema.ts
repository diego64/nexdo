import { z } from 'zod';
import { StatusTarefa } from '../../../dominio/enums/status-tarefa.js';
import { PrioridadeTarefa } from '../../../dominio/enums/prioridade-tarefa.js';

// Query string: filtros combináveis + paginação.
export const filtrarTarefasEsquema = z
  .object({
    status: z.nativeEnum(StatusTarefa).optional(),
    prioridade: z.nativeEnum(PrioridadeTarefa).optional(),
    time: z.coerce.number().int().positive().optional(),
    pagina: z.coerce.number().int().positive().default(1),
    limite: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export type FiltrarTarefasDTO = z.infer<typeof filtrarTarefasEsquema>;
