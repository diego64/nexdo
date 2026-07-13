import type { FastifyRequest } from 'fastify';
import { z, type ZodTypeAny } from 'zod';

/**
 * ErrorMap PT-BR do Zod — mensagens de validação em português na borda HTTP.
 * Aplicado globalmente em `configurarValidacaoPtBr()`.
 */
const mapaPtBr: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined') return { message: 'Campo obrigatório' };
      return { message: `Tipo inválido: esperado ${issue.expected}` };
    case z.ZodIssueCode.unrecognized_keys:
      return { message: `Campo(s) não permitido(s): ${issue.keys.join(', ')}` };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: `Valor inválido. Use um de: ${issue.options.join(', ')}` };
    case z.ZodIssueCode.too_small:
      return { message: `Valor muito curto (mínimo ${issue.minimum})` };
    case z.ZodIssueCode.too_big:
      return { message: `Valor acima do máximo permitido (${issue.maximum})` };
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') return { message: 'E-mail inválido' };
      return { message: 'Texto inválido' };
    default:
      return { message: ctx.defaultError };
  }
};

/** Define o errorMap PT-BR globalmente. Chamado no bootstrap. */
export function configurarValidacaoPtBr(): void {
  z.setErrorMap(mapaPtBr);
}

/**
 * preHandlers de validação com `safeParse`. Em falha, lançam o ZodError (o
 * tratador global responde 400 com envelope VALIDACAO). Em sucesso, substituem
 * a fonte pelos dados já validados/coeridos.
 */
export function validarCorpo(esquema: ZodTypeAny) {
  return async function (request: FastifyRequest): Promise<void> {
    const resultado = esquema.safeParse(request.body);
    if (!resultado.success) throw resultado.error;
    request.body = resultado.data;
  };
}

export function validarQuery(esquema: ZodTypeAny) {
  return async function (request: FastifyRequest): Promise<void> {
    const resultado = esquema.safeParse(request.query);
    if (!resultado.success) throw resultado.error;
    request.query = resultado.data;
  };
}

export function validarParams(esquema: ZodTypeAny) {
  return async function (request: FastifyRequest): Promise<void> {
    const resultado = esquema.safeParse(request.params);
    if (!resultado.success) throw resultado.error;
    request.params = resultado.data;
  };
}
