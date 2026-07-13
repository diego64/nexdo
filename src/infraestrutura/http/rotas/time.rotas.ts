import type { FastifyInstance } from 'fastify';
import { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import { autenticar } from '../middlewares/autenticacao.middleware.js';
import { exigirPapel } from '../middlewares/autorizacao.middleware.js';
import type { CriarTimeCasoDeUso } from '../../../aplicacao/casos-de-uso/times/criar-time.caso-de-uso.js';
import type { ListarTimesCasoDeUso } from '../../../aplicacao/casos-de-uso/times/listar-times.caso-de-uso.js';
import type { EditarTimeCasoDeUso } from '../../../aplicacao/casos-de-uso/times/editar-time.caso-de-uso.js';
import type { ExcluirTimeCasoDeUso } from '../../../aplicacao/casos-de-uso/times/excluir-time.caso-de-uso.js';
import type { AdicionarMembroCasoDeUso } from '../../../aplicacao/casos-de-uso/times/adicionar-membro.caso-de-uso.js';
import type { RemoverMembroCasoDeUso } from '../../../aplicacao/casos-de-uso/times/remover-membro.caso-de-uso.js';
import type { ListarMembrosCasoDeUso } from '../../../aplicacao/casos-de-uso/times/listar-membros.caso-de-uso.js';
import {
  adicionarMembroControlador,
  criarTimeControlador,
  editarTimeControlador,
  excluirTimeControlador,
  listarMembrosControlador,
  listarTimesControlador,
  removerMembroControlador,
} from '../controladores/time.controlador.js';

export interface DepsTimes {
  criarTime: CriarTimeCasoDeUso;
  listarTimes: ListarTimesCasoDeUso;
  editarTime: EditarTimeCasoDeUso;
  excluirTime: ExcluirTimeCasoDeUso;
  adicionarMembro: AdicionarMembroCasoDeUso;
  removerMembro: RemoverMembroCasoDeUso;
  listarMembros: ListarMembrosCasoDeUso;
}

export function registrarRotasTimes(app: FastifyInstance, deps: DepsTimes): void {
  const somenteAdmin = { preHandler: [autenticar, exigirPapel(PapelUsuario.Admin)] };

  app.post('/times', somenteAdmin, criarTimeControlador(deps.criarTime));
  app.get('/times', somenteAdmin, listarTimesControlador(deps.listarTimes));
  app.put('/times/:id', somenteAdmin, editarTimeControlador(deps.editarTime));
  app.delete('/times/:id', somenteAdmin, excluirTimeControlador(deps.excluirTime));
  app.post('/times/:id/membros', somenteAdmin, adicionarMembroControlador(deps.adicionarMembro));
  app.delete(
    '/times/:id/membros/:userId',
    somenteAdmin,
    removerMembroControlador(deps.removerMembro),
  );

  // admin OU member do time — autz fina fica no caso de uso.
  app.get(
    '/times/:id/membros',
    { preHandler: [autenticar] },
    listarMembrosControlador(deps.listarMembros),
  );
}
