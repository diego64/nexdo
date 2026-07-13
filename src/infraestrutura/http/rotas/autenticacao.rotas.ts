import type { FastifyInstance } from 'fastify';
import type { CriarUsuarioCasoDeUso } from '../../../aplicacao/casos-de-uso/autenticacao/criar-usuario.caso-de-uso.js';
import type { AutenticarUsuarioCasoDeUso } from '../../../aplicacao/casos-de-uso/autenticacao/autenticar-usuario.caso-de-uso.js';
import { criarUsuarioControlador } from '../controladores/usuario.controlador.js';
import { autenticarControlador } from '../controladores/sessao.controlador.js';
import { validarCorpo } from '../middlewares/validacao.middleware.js';
import { criarUsuarioEsquema } from '../esquemas/criar-usuario.esquema.js';
import { autenticarEsquema } from '../esquemas/autenticar.esquema.js';

export interface DepsAutenticacao {
  criarUsuario: CriarUsuarioCasoDeUso;
  autenticar: AutenticarUsuarioCasoDeUso;
}

/** Rotas públicas de autenticação (POST /usuarios, POST /sessoes). */
export function registrarRotasAutenticacao(app: FastifyInstance, deps: DepsAutenticacao): void {
  app.post(
    '/usuarios',
    { preHandler: [validarCorpo(criarUsuarioEsquema)] },
    criarUsuarioControlador(deps.criarUsuario),
  );
  app.post(
    '/sessoes',
    { preHandler: [validarCorpo(autenticarEsquema)] },
    autenticarControlador(deps.autenticar),
  );
}
