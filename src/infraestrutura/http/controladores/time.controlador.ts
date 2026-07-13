import type { FastifyReply, FastifyRequest } from 'fastify';
import { ErroNaoAutorizado } from '../../../dominio/erros/erros-de-dominio.js';
import type { UsuarioAutenticado } from '../middlewares/autenticacao.middleware.js';
import type { CriarTimeCasoDeUso } from '../../../aplicacao/casos-de-uso/times/criar-time.caso-de-uso.js';
import type { ListarTimesCasoDeUso } from '../../../aplicacao/casos-de-uso/times/listar-times.caso-de-uso.js';
import type { EditarTimeCasoDeUso } from '../../../aplicacao/casos-de-uso/times/editar-time.caso-de-uso.js';
import type { ExcluirTimeCasoDeUso } from '../../../aplicacao/casos-de-uso/times/excluir-time.caso-de-uso.js';
import type { AdicionarMembroCasoDeUso } from '../../../aplicacao/casos-de-uso/times/adicionar-membro.caso-de-uso.js';
import type { RemoverMembroCasoDeUso } from '../../../aplicacao/casos-de-uso/times/remover-membro.caso-de-uso.js';
import type { ListarMembrosCasoDeUso } from '../../../aplicacao/casos-de-uso/times/listar-membros.caso-de-uso.js';
import { criarTimeEsquema } from '../esquemas/criar-time.esquema.js';
import { editarTimeEsquema } from '../esquemas/editar-time.esquema.js';
import {
  adicionarMembroEsquema,
  idParamEsquema,
  membroParamsEsquema,
  paginacaoEsquema,
} from '../esquemas/adicionar-membro.esquema.js';

function solicitanteDe(request: FastifyRequest): UsuarioAutenticado {
  if (!request.usuario) {
    throw new ErroNaoAutorizado('Não autenticado');
  }
  return request.usuario;
}

export function criarTimeControlador(caso: CriarTimeCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const dados = criarTimeEsquema.parse(request.body);
    const solicitante = solicitanteDe(request);
    const time = await caso.executar({
      name: dados.name,
      description: dados.description ?? null,
      solicitante,
    });
    reply.status(201).send(time.paraResposta());
  };
}

export function listarTimesControlador(caso: ListarTimesCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { pagina, limite } = paginacaoEsquema.parse(request.query);
    const resultado = await caso.executar({ pagina, limite });
    reply.status(200).send({
      dados: resultado.dados.map((t) => t.paraResposta()),
      total: resultado.total,
      pagina: resultado.pagina,
    });
  };
}

export function editarTimeControlador(caso: EditarTimeCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = idParamEsquema.parse(request.params);
    const dados = editarTimeEsquema.parse(request.body);
    const solicitante = solicitanteDe(request);
    const time = await caso.executar({
      id,
      name: dados.name,
      description: dados.description ?? null,
      solicitante,
    });
    reply.status(200).send(time.paraResposta());
  };
}

export function excluirTimeControlador(caso: ExcluirTimeCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = idParamEsquema.parse(request.params);
    const solicitante = solicitanteDe(request);
    await caso.executar({ id, solicitante });
    reply.status(204).send();
  };
}

export function adicionarMembroControlador(caso: AdicionarMembroCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = idParamEsquema.parse(request.params);
    const { user_id } = adicionarMembroEsquema.parse(request.body);
    const solicitante = solicitanteDe(request);
    await caso.executar({ teamId: id, userId: user_id, solicitante });
    reply.status(201).send({ team_id: id, user_id });
  };
}

export function removerMembroControlador(caso: RemoverMembroCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id, userId } = membroParamsEsquema.parse(request.params);
    const solicitante = solicitanteDe(request);
    await caso.executar({ teamId: id, userId, solicitante });
    reply.status(204).send();
  };
}

export function listarMembrosControlador(caso: ListarMembrosCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = idParamEsquema.parse(request.params);
    const solicitante = solicitanteDe(request);
    const membros = await caso.executar({ teamId: id, solicitante });
    reply.status(200).send(membros);
  };
}
