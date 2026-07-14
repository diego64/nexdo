import type { FastifyInstance } from 'fastify';
import { autenticar } from '../middlewares/autenticacao.middleware.js';
import { validarCorpo } from '../middlewares/validacao.middleware.js';
import { corrigirPerfilEsquema } from '../esquemas/corrigir-perfil.esquema.js';
import type { ObterMeuPerfilCasoDeUso } from '../../../aplicacao/casos-de-uso/usuarios/obter-meu-perfil.caso-de-uso.js';
import type { CorrigirMeuPerfilCasoDeUso } from '../../../aplicacao/casos-de-uso/usuarios/corrigir-meu-perfil.caso-de-uso.js';
import type { AnonimizarMeuPerfilCasoDeUso } from '../../../aplicacao/casos-de-uso/usuarios/anonimizar-meu-perfil.caso-de-uso.js';
import {
  anonimizarMeuPerfilControlador,
  corrigirMeuPerfilControlador,
  obterMeuPerfilControlador,
} from '../controladores/usuario-me.controlador.js';

export interface DepsUsuarioMe {
  obterMeuPerfil: ObterMeuPerfilCasoDeUso;
  corrigirMeuPerfil: CorrigirMeuPerfilCasoDeUso;
  anonimizarMeuPerfil: AnonimizarMeuPerfilCasoDeUso;
}

/** Direitos do titular (LGPD): o usuário opera apenas sobre si mesmo. */
export function registrarRotasUsuarioMe(app: FastifyInstance, deps: DepsUsuarioMe): void {
  app.get('/usuarios/me', { preHandler: [autenticar] }, obterMeuPerfilControlador(deps.obterMeuPerfil));
  app.patch(
    '/usuarios/me',
    { preHandler: [autenticar, validarCorpo(corrigirPerfilEsquema)] },
    corrigirMeuPerfilControlador(deps.corrigirMeuPerfil),
  );
  app.delete(
    '/usuarios/me',
    { preHandler: [autenticar] },
    anonimizarMeuPerfilControlador(deps.anonimizarMeuPerfil),
  );
}
