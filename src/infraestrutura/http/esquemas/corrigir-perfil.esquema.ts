import { z } from 'zod';

// Correção parcial: pelo menos um campo deve ser informado.
export const corrigirPerfilEsquema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().email().max(150).optional(),
  })
  .strict()
  .refine((d) => d.name !== undefined || d.email !== undefined, {
    message: 'Informe ao menos um campo (name ou email)',
  });

export type CorrigirPerfilDTO = z.infer<typeof corrigirPerfilEsquema>;
