import type { FastifyRequest } from 'fastify';
import type { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import { ErroNaoAutorizado, ErroProibido } from '../../../dominio/erros/erros-de-dominio.js';

/**
 * preHandler que exige que o usuário autenticado tenha um dos papéis informados.
 * Deve rodar depois de `autenticar`. Regras finas (posse/pertencimento) ficam
 * no caso de uso, não aqui (CLAUDE.md §6).
 */
export function exigirPapel(...papeis: PapelUsuario[]) {
  return async function verificarPapel(request: FastifyRequest): Promise<void> {
    if (!request.usuario) {
      throw new ErroNaoAutorizado('Não autenticado');
    }
    if (!papeis.includes(request.usuario.papel)) {
      throw new ErroProibido('Permissão insuficiente para esta ação');
    }
  };
}
