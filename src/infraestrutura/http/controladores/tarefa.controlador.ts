import type { FastifyReply, FastifyRequest } from 'fastify';
import { ErroNaoAutorizado } from '../../../dominio/erros/erros-de-dominio.js';
import type { UsuarioAutenticado } from '../middlewares/autenticacao.middleware.js';
import type { CriarTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/criar-tarefa.caso-de-uso.js';
import type { ListarTarefasCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/listar-tarefas.caso-de-uso.js';
import type { ObterTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/obter-tarefa.caso-de-uso.js';
import type { EditarTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/editar-tarefa.caso-de-uso.js';
import type { ExcluirTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/excluir-tarefa.caso-de-uso.js';
import type { AtribuirTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/atribuir-tarefa.caso-de-uso.js';
import type { ListarHistoricoTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/historico/listar-historico-tarefa.caso-de-uso.js';
import type { CriarTarefaDTO } from '../esquemas/criar-tarefa.esquema.js';
import type { EditarTarefaDTO } from '../esquemas/editar-tarefa.esquema.js';
import type { FiltrarTarefasDTO } from '../esquemas/filtrar-tarefas.esquema.js';
import type { AtribuirTarefaDTO } from '../esquemas/atribuir-tarefa.esquema.js';

// Dados já validados/coeridos pelos preHandlers de validação (SPEC 07).
function solicitanteDe(request: FastifyRequest): UsuarioAutenticado {
  if (!request.usuario) {
    throw new ErroNaoAutorizado('Não autenticado');
  }
  return request.usuario;
}

export function criarTarefaControlador(caso: CriarTarefaCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const dados = request.body as CriarTarefaDTO;
    const tarefa = await caso.executar({
      title: dados.title,
      description: dados.description ?? null,
      status: dados.status,
      priority: dados.priority,
      assignedTo: dados.assigned_to ?? null,
      teamId: dados.team_id,
      solicitante: solicitanteDe(request),
    });
    reply.status(201).send(tarefa.paraResposta());
  };
}

export function listarTarefasControlador(caso: ListarTarefasCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const q = request.query as FiltrarTarefasDTO;
    const resultado = await caso.executar({
      filtros: { status: q.status, prioridade: q.prioridade, time: q.time },
      pagina: q.pagina,
      limite: q.limite,
      solicitante: solicitanteDe(request),
    });
    reply.status(200).send({
      dados: resultado.dados.map((t) => t.paraResposta()),
      total: resultado.total,
      pagina: resultado.pagina,
    });
  };
}

export function obterTarefaControlador(caso: ObterTarefaCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: number };
    const tarefa = await caso.executar({ id, solicitante: solicitanteDe(request) });
    reply.status(200).send(tarefa.paraResposta());
  };
}

export function editarTarefaControlador(caso: EditarTarefaCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: number };
    const dados = request.body as EditarTarefaDTO;
    const tarefa = await caso.executar({ id, dados, solicitante: solicitanteDe(request) });
    reply.status(200).send(tarefa.paraResposta());
  };
}

export function excluirTarefaControlador(caso: ExcluirTarefaCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: number };
    await caso.executar({ id, solicitante: solicitanteDe(request) });
    reply.status(204).send();
  };
}

export function atribuirTarefaControlador(caso: AtribuirTarefaCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: number };
    const { user_id } = request.body as AtribuirTarefaDTO;
    const tarefa = await caso.executar({ id, userId: user_id, solicitante: solicitanteDe(request) });
    reply.status(200).send(tarefa.paraResposta());
  };
}

export function listarHistoricoControlador(caso: ListarHistoricoTarefaCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: number };
    const historico = await caso.executar({ taskId: id, solicitante: solicitanteDe(request) });
    reply.status(200).send(historico.map((h) => h.paraResposta()));
  };
}
