import type { FastifyInstance } from 'fastify';
import { autenticar } from '../middlewares/autenticacao.middleware.js';
import type { CriarTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/criar-tarefa.caso-de-uso.js';
import type { ListarTarefasCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/listar-tarefas.caso-de-uso.js';
import type { ObterTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/obter-tarefa.caso-de-uso.js';
import type { EditarTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/editar-tarefa.caso-de-uso.js';
import type { ExcluirTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/excluir-tarefa.caso-de-uso.js';
import type { AtribuirTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/tarefas/atribuir-tarefa.caso-de-uso.js';
import type { ListarHistoricoTarefaCasoDeUso } from '../../../aplicacao/casos-de-uso/historico/listar-historico-tarefa.caso-de-uso.js';
import {
  atribuirTarefaControlador,
  criarTarefaControlador,
  editarTarefaControlador,
  excluirTarefaControlador,
  listarHistoricoControlador,
  listarTarefasControlador,
  obterTarefaControlador,
} from '../controladores/tarefa.controlador.js';
import { validarCorpo, validarParams, validarQuery } from '../middlewares/validacao.middleware.js';
import { criarTarefaEsquema } from '../esquemas/criar-tarefa.esquema.js';
import { editarTarefaEsquema } from '../esquemas/editar-tarefa.esquema.js';
import { filtrarTarefasEsquema } from '../esquemas/filtrar-tarefas.esquema.js';
import { atribuirTarefaEsquema, tarefaIdParamEsquema } from '../esquemas/atribuir-tarefa.esquema.js';

export interface DepsTarefas {
  criarTarefa: CriarTarefaCasoDeUso;
  listarTarefas: ListarTarefasCasoDeUso;
  obterTarefa: ObterTarefaCasoDeUso;
  editarTarefa: EditarTarefaCasoDeUso;
  excluirTarefa: ExcluirTarefaCasoDeUso;
  atribuirTarefa: AtribuirTarefaCasoDeUso;
  listarHistorico: ListarHistoricoTarefaCasoDeUso;
}

// Toda a matriz de permissões vive nos casos de uso; aqui só exigimos autenticação.
export function registrarRotasTarefas(app: FastifyInstance, deps: DepsTarefas): void {
  const idParam = validarParams(tarefaIdParamEsquema);

  app.post(
    '/tarefas',
    { preHandler: [autenticar, validarCorpo(criarTarefaEsquema)] },
    criarTarefaControlador(deps.criarTarefa),
  );
  app.get(
    '/tarefas',
    { preHandler: [autenticar, validarQuery(filtrarTarefasEsquema)] },
    listarTarefasControlador(deps.listarTarefas),
  );
  app.get(
    '/tarefas/:id',
    { preHandler: [autenticar, idParam] },
    obterTarefaControlador(deps.obterTarefa),
  );
  app.put(
    '/tarefas/:id',
    { preHandler: [autenticar, idParam, validarCorpo(editarTarefaEsquema)] },
    editarTarefaControlador(deps.editarTarefa),
  );
  app.delete(
    '/tarefas/:id',
    { preHandler: [autenticar, idParam] },
    excluirTarefaControlador(deps.excluirTarefa),
  );
  app.patch(
    '/tarefas/:id/atribuir',
    { preHandler: [autenticar, idParam, validarCorpo(atribuirTarefaEsquema)] },
    atribuirTarefaControlador(deps.atribuirTarefa),
  );
  app.get(
    '/tarefas/:id/historico',
    { preHandler: [autenticar, idParam] },
    listarHistoricoControlador(deps.listarHistorico),
  );
}
