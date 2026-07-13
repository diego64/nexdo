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
import { validarCorpo, validarParams, validarQuery } from '../middlewares/validacao.middleware.js';
import { criarTimeEsquema } from '../esquemas/criar-time.esquema.js';
import { editarTimeEsquema } from '../esquemas/editar-time.esquema.js';
import {
  adicionarMembroEsquema,
  idParamEsquema,
  membroParamsEsquema,
  paginacaoEsquema,
} from '../esquemas/adicionar-membro.esquema.js';

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
  const admin = [autenticar, exigirPapel(PapelUsuario.Admin)];

  app.post(
    '/times',
    { preHandler: [...admin, validarCorpo(criarTimeEsquema)] },
    criarTimeControlador(deps.criarTime),
  );
  app.get(
    '/times',
    { preHandler: [...admin, validarQuery(paginacaoEsquema)] },
    listarTimesControlador(deps.listarTimes),
  );
  app.put(
    '/times/:id',
    { preHandler: [...admin, validarParams(idParamEsquema), validarCorpo(editarTimeEsquema)] },
    editarTimeControlador(deps.editarTime),
  );
  app.delete(
    '/times/:id',
    { preHandler: [...admin, validarParams(idParamEsquema)] },
    excluirTimeControlador(deps.excluirTime),
  );
  app.post(
    '/times/:id/membros',
    { preHandler: [...admin, validarParams(idParamEsquema), validarCorpo(adicionarMembroEsquema)] },
    adicionarMembroControlador(deps.adicionarMembro),
  );
  app.delete(
    '/times/:id/membros/:userId',
    { preHandler: [...admin, validarParams(membroParamsEsquema)] },
    removerMembroControlador(deps.removerMembro),
  );

  // admin OU member do time — autz fina fica no caso de uso.
  app.get(
    '/times/:id/membros',
    { preHandler: [autenticar, validarParams(idParamEsquema)] },
    listarMembrosControlador(deps.listarMembros),
  );
}
