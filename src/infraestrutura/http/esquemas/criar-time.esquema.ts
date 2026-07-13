import { z } from 'zod';

export const criarTimeEsquema = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(2000).nullish(),
  })
  .strict();

export type CriarTimeDTO = z.infer<typeof criarTimeEsquema>;
