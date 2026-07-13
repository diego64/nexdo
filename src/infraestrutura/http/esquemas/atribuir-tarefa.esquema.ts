import { z } from 'zod';

export const atribuirTarefaEsquema = z
  .object({
    user_id: z.number().int().positive(),
  })
  .strict();

export type AtribuirTarefaDTO = z.infer<typeof atribuirTarefaEsquema>;

export const tarefaIdParamEsquema = z.object({
  id: z.coerce.number().int().positive(),
});
