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
import type { CriarTimeDTO } from '../esquemas/criar-time.esquema.js';
import type { EditarTimeDTO } from '../esquemas/editar-time.esquema.js';
import type { AdicionarMembroDTO } from '../esquemas/adicionar-membro.esquema.js';

// Dados já validados/coeridos pelos preHandlers de validação (SPEC 07).
function solicitanteDe(request: FastifyRequest): UsuarioAutenticado {
  if (!request.usuario) {
    throw new ErroNaoAutorizado('Não autenticado');
  }
  return request.usuario;
}

export function criarTimeControlador(caso: CriarTimeCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const dados = request.body as CriarTimeDTO;
    const time = await caso.executar({
      name: dados.name,
      description: dados.description ?? null,
      solicitante: solicitanteDe(request),
    });
    reply.status(201).send(time.paraResposta());
  };
}

export function listarTimesControlador(caso: ListarTimesCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { pagina, limite } = request.query as { pagina: number; limite: number };
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
    const { id } = request.params as { id: number };
    const dados = request.body as EditarTimeDTO;
    const time = await caso.executar({
      id,
      name: dados.name,
      description: dados.description ?? null,
      solicitante: solicitanteDe(request),
    });
    reply.status(200).send(time.paraResposta());
  };
}

export function excluirTimeControlador(caso: ExcluirTimeCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: number };
    await caso.executar({ id, solicitante: solicitanteDe(request) });
    reply.status(204).send();
  };
}

export function adicionarMembroControlador(caso: AdicionarMembroCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: number };
    const { user_id } = request.body as AdicionarMembroDTO;
    await caso.executar({ teamId: id, userId: user_id, solicitante: solicitanteDe(request) });
    reply.status(201).send({ team_id: id, user_id });
  };
}

export function removerMembroControlador(caso: RemoverMembroCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id, userId } = request.params as { id: number; userId: number };
    await caso.executar({ teamId: id, userId, solicitante: solicitanteDe(request) });
    reply.status(204).send();
  };
}

export function listarMembrosControlador(caso: ListarMembrosCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: number };
    const membros = await caso.executar({ teamId: id, solicitante: solicitanteDe(request) });
    reply.status(200).send(membros);
  };
}
