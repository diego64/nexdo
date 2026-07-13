import { z } from 'zod';

// PUT substitui o recurso: mesmos campos de criação.
export const editarTimeEsquema = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(2000).nullish(),
  })
  .strict();

export type EditarTimeDTO = z.infer<typeof editarTimeEsquema>;
