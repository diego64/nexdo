import type { FastifyInstance } from 'fastify';
import type { CriarUsuarioCasoDeUso } from '../../../aplicacao/casos-de-uso/autenticacao/criar-usuario.caso-de-uso.js';
import type { AutenticarUsuarioCasoDeUso } from '../../../aplicacao/casos-de-uso/autenticacao/autenticar-usuario.caso-de-uso.js';
import { criarUsuarioControlador } from '../controladores/usuario.controlador.js';
import { autenticarControlador } from '../controladores/sessao.controlador.js';

export interface DepsAutenticacao {
  criarUsuario: CriarUsuarioCasoDeUso;
  autenticar: AutenticarUsuarioCasoDeUso;
}

/** Rotas públicas de autenticação (POST /usuarios, POST /sessoes). */
export function registrarRotasAutenticacao(app: FastifyInstance, deps: DepsAutenticacao): void {
  app.post('/usuarios', criarUsuarioControlador(deps.criarUsuario));
  app.post('/sessoes', autenticarControlador(deps.autenticar));
}
