import { z } from 'zod';

// .strict() previne mass assignment (seguranca.md). Zod só na borda HTTP.
export const criarUsuarioEsquema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(150),
    // bcrypt trunca em 72 bytes; limitamos para evitar surpresa silenciosa.
    password: z.string().min(8).max(72),
  })
  .strict();

export type CriarUsuarioDTO = z.infer<typeof criarUsuarioEsquema>;
