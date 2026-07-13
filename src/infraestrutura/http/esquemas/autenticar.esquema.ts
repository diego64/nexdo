import { z } from 'zod';

export const autenticarEsquema = z
  .object({
    email: z.string().trim().email().max(150),
    password: z.string().min(1),
  })
  .strict();

export type AutenticarDTO = z.infer<typeof autenticarEsquema>;
