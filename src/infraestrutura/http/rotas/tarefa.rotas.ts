import type { FastifyInstance } from 'fastify';
import { autenticar } from '../middlewares/autenticacao.middleware.js';
import type { CriarTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/criar-tarefa.caso-de-uso.js';
import type { ListarTarefasCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/listar-tarefas.caso-de-uso.js';
import type { ObterTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/obter-tarefa.caso-de-uso.js';
import type { EditarTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/editar-tarefa.caso-de-uso.js';
import type { ExcluirTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/excluir-tarefa.caso-de-uso.js';
import type { AtribuirTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/atribuir-tarefa.caso-de-uso.js';
import {
  atribuirTarefaControlador,
  criarTarefaControlador,
  editarTarefaControlador,
  excluirTarefaControlador,
  listarTarefasControlador,
  obterTarefaControlador,
} from '../controladores/tarefa.controlador.js';

export interface DepsTarefas {
  criarTarefa: CriarTarefaCasoDeUso;
  listarTarefas: ListarTarefasCasoDeUso;
  obterTarefa: ObterTarefaCasoDeUso;
  editarTarefa: EditarTarefaCasoDeUso;
  excluirTarefa: ExcluirTarefaCasoDeUso;
  atribuirTarefa: AtribuirTarefaCasoDeUso;
}

// Toda a matriz de permissões vive nos casos de uso; aqui só exigimos autenticação.
export function registrarRotasTarefas(app: FastifyInstance, deps: DepsTarefas): void {
  const autenticado = { preHandler: [autenticar] };

  app.post('/tarefas', autenticado, criarTarefaControlador(deps.criarTarefa));
  app.get('/tarefas', autenticado, listarTarefasControlador(deps.listarTarefas));
  app.get('/tarefas/:id', autenticado, obterTarefaControlador(deps.obterTarefa));
  app.put('/tarefas/:id', autenticado, editarTarefaControlador(deps.editarTarefa));
  app.delete('/tarefas/:id', autenticado, excluirTarefaControlador(deps.excluirTarefa));
  app.patch('/tarefas/:id/atribuir', autenticado, atribuirTarefaControlador(deps.atribuirTarefa));
}
