import { z } from 'zod';

export const adicionarMembroEsquema = z
  .object({
    user_id: z.number().int().positive(),
  })
  .strict();

export type AdicionarMembroDTO = z.infer<typeof adicionarMembroEsquema>;

/** Parâmetros de rota numéricos reaproveitados por várias rotas de /times. */
export const idParamEsquema = z.object({
  id: z.coerce.number().int().positive(),
});

export const membroParamsEsquema = z.object({
  id: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive(),
});

export const paginacaoEsquema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(100).default(20),
});
