import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CriarUsuarioCasoDeUso } from '../../../aplicacao/casos-de-uso/autenticacao/criar-usuario.caso-de-uso.js';
import { criarUsuarioEsquema } from '../esquemas/criar-usuario.esquema.js';

export function criarUsuarioControlador(caso: CriarUsuarioCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const dados = criarUsuarioEsquema.parse(request.body);
    const usuario = await caso.executar({
      name: dados.name,
      email: dados.email,
      senha: dados.password,
    });
    reply.status(201).send(usuario.paraResposta());
  };
}
