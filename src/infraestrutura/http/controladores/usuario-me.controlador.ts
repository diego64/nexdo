import type { FastifyReply, FastifyRequest } from 'fastify';
import { ErroNaoAutorizado } from '../../../dominio/erros/erros-de-dominio.js';
import type { UsuarioAutenticado } from '../middlewares/autenticacao.middleware.js';
import type { ObterMeuPerfilCasoDeUso } from '../../../aplicacao/casos-de-uso/usuarios/obter-meu-perfil.caso-de-uso.js';
import type { CorrigirMeuPerfilCasoDeUso } from '../../../aplicacao/casos-de-uso/usuarios/corrigir-meu-perfil.caso-de-uso.js';
import type { AnonimizarMeuPerfilCasoDeUso } from '../../../aplicacao/casos-de-uso/usuarios/anonimizar-meu-perfil.caso-de-uso.js';
import type { CorrigirPerfilDTO } from '../esquemas/corrigir-perfil.esquema.js';

function solicitanteDe(request: FastifyRequest): UsuarioAutenticado {
  if (!request.usuario) {
    throw new ErroNaoAutorizado('Não autenticado');
  }
  return request.usuario;
}

export function obterMeuPerfilControlador(caso: ObterMeuPerfilCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const usuario = await caso.executar({ solicitante: solicitanteDe(request) });
    reply.status(200).send(usuario.paraResposta());
  };
}

export function corrigirMeuPerfilControlador(caso: CorrigirMeuPerfilCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const dados = request.body as CorrigirPerfilDTO;
    const usuario = await caso.executar({
      name: dados.name,
      email: dados.email,
      solicitante: solicitanteDe(request),
    });
    reply.status(200).send(usuario.paraResposta());
  };
}

export function anonimizarMeuPerfilControlador(caso: AnonimizarMeuPerfilCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await caso.executar({ solicitante: solicitanteDe(request) });
    reply.status(204).send();
  };
}
