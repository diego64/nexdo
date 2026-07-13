import { z } from 'zod';
import { StatusTarefa } from '../../../dominio/enums/status-tarefa.js';
import { PrioridadeTarefa } from '../../../dominio/enums/prioridade-tarefa.js';

export const criarTarefaEsquema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).nullish(),
    status: z.nativeEnum(StatusTarefa).default(StatusTarefa.Pendente),
    priority: z.nativeEnum(PrioridadeTarefa).default(PrioridadeTarefa.Media),
    assigned_to: z.number().int().positive().nullish(),
    team_id: z.number().int().positive(),
  })
  .strict();

export type CriarTarefaDTO = z.infer<typeof criarTarefaEsquema>;
