import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';
import { carregarConfig, type Config } from './compartilhado/config.js';
import { obterPool } from './infraestrutura/banco/postgres/conexao.js';
import { PgUsuarioRepositorio } from './infraestrutura/banco/postgres/pg-usuario.repositorio.js';
import { PgTimeRepositorio } from './infraestrutura/banco/postgres/pg-time.repositorio.js';
import { PgMembroTimeRepositorio } from './infraestrutura/banco/postgres/pg-membro-time.repositorio.js';
import { PgTarefaRepositorio } from './infraestrutura/banco/postgres/pg-tarefa.repositorio.js';
import { PgHistoricoTarefaRepositorio } from './infraestrutura/banco/postgres/pg-historico-tarefa.repositorio.js';
import { MongoAuditoriaRepositorio } from './infraestrutura/banco/mongo/mongo-auditoria.repositorio.js';
import { BcryptHasher } from './infraestrutura/seguranca/bcrypt-hasher.js';
import { CriarUsuarioCasoDeUso } from './aplicacao/casos-de-uso/autenticacao/criar-usuario.caso-de-uso.js';
import { AutenticarUsuarioCasoDeUso } from './aplicacao/casos-de-uso/autenticacao/autenticar-usuario.caso-de-uso.js';
import { CriarTimeCasoDeUso } from './aplicacao/casos-de-uso/times/criar-time.caso-de-uso.js';
import { ListarTimesCasoDeUso } from './aplicacao/casos-de-uso/times/listar-times.caso-de-uso.js';
import { EditarTimeCasoDeUso } from './aplicacao/casos-de-uso/times/editar-time.caso-de-uso.js';
import { ExcluirTimeCasoDeUso } from './aplicacao/casos-de-uso/times/excluir-time.caso-de-uso.js';
import { AdicionarMembroCasoDeUso } from './aplicacao/casos-de-uso/times/adicionar-membro.caso-de-uso.js';
import { RemoverMembroCasoDeUso } from './aplicacao/casos-de-uso/times/remover-membro.caso-de-uso.js';
import { ListarMembrosCasoDeUso } from './aplicacao/casos-de-uso/times/listar-membros.caso-de-uso.js';
import { CriarTarefaCasoDeUso } from './aplicacao/casos-de-uso/tarefas/criar-tarefa.caso-de-uso.js';
import { ListarTarefasCasoDeUso } from './aplicacao/casos-de-uso/tarefas/listar-tarefas.caso-de-uso.js';
import { ObterTarefaCasoDeUso } from './aplicacao/casos-de-uso/tarefas/obter-tarefa.caso-de-uso.js';
import { EditarTarefaCasoDeUso } from './aplicacao/casos-de-uso/tarefas/editar-tarefa.caso-de-uso.js';
import { ExcluirTarefaCasoDeUso } from './aplicacao/casos-de-uso/tarefas/excluir-tarefa.caso-de-uso.js';
import { AtribuirTarefaCasoDeUso } from './aplicacao/casos-de-uso/tarefas/atribuir-tarefa.caso-de-uso.js';
import { ListarHistoricoTarefaCasoDeUso } from './aplicacao/casos-de-uso/historico/listar-historico-tarefa.caso-de-uso.js';
import { ObterMeuPerfilCasoDeUso } from './aplicacao/casos-de-uso/usuarios/obter-meu-perfil.caso-de-uso.js';
import { CorrigirMeuPerfilCasoDeUso } from './aplicacao/casos-de-uso/usuarios/corrigir-meu-perfil.caso-de-uso.js';
import { AnonimizarMeuPerfilCasoDeUso } from './aplicacao/casos-de-uso/usuarios/anonimizar-meu-perfil.caso-de-uso.js';
import { tratadorDeErros } from './infraestrutura/http/middlewares/erros.middleware.js';
import { configurarValidacaoPtBr } from './infraestrutura/http/middlewares/validacao.middleware.js';
import { registrarRotasAutenticacao } from './infraestrutura/http/rotas/autenticacao.rotas.js';
import { registrarRotasTimes } from './infraestrutura/http/rotas/time.rotas.js';
import { registrarRotasTarefas } from './infraestrutura/http/rotas/tarefa.rotas.js';
import { registrarRotasUsuarioMe } from './infraestrutura/http/rotas/usuario-me.rotas.js';

/**
 * Composition root: instancia dependências (injeção manual) e registra rotas.
 * Separado de `iniciar()` para permitir testes via `app.inject()`.
 */
export function construirApp(config: Config): FastifyInstance {
  const app = Fastify({
    logger: config.nodeEnv === 'test' ? false : { level: 'info' },
  });

  configurarValidacaoPtBr(); // mensagens de validação Zod em PT-BR (SPEC 07)

  // Hardening (OWASP API8/API4): cabeçalhos de segurança + rate limiting.
  app.register(fastifyHelmet);
  // Rate limit desativado em testes (E2E fazem muitas requisições da mesma origem).
  if (config.nodeEnv !== 'test') {
    app.register(fastifyRateLimit, { max: 100, timeWindow: '1 minute' });
  }

  app.register(fastifyCors, { origin: config.corsOrigens });
  app.register(fastifyJwt, {
    secret: config.jwtSecret,
    sign: { expiresIn: config.jwtExpiracao },
  });

  app.setErrorHandler(tratadorDeErros);

  // --- Injeção de dependências (manual, sem container) ---
  const pool = obterPool();
  const usuarioRepositorio = new PgUsuarioRepositorio(pool);
  const timeRepositorio = new PgTimeRepositorio(pool);
  const membroTimeRepositorio = new PgMembroTimeRepositorio(pool);
  const tarefaRepositorio = new PgTarefaRepositorio(pool);
  const historicoTarefaRepositorio = new PgHistoricoTarefaRepositorio(pool);
  const auditoria = new MongoAuditoriaRepositorio();
  const hasher = new BcryptHasher();

  const criarUsuario = new CriarUsuarioCasoDeUso(usuarioRepositorio, hasher, auditoria);
  const autenticar = new AutenticarUsuarioCasoDeUso(usuarioRepositorio, hasher, auditoria);

  // --- Rotas ---
  app.get('/saude', async () => ({ status: 'ok' }));
  registrarRotasAutenticacao(app, { criarUsuario, autenticar });
  registrarRotasUsuarioMe(app, {
    obterMeuPerfil: new ObterMeuPerfilCasoDeUso(usuarioRepositorio, auditoria),
    corrigirMeuPerfil: new CorrigirMeuPerfilCasoDeUso(usuarioRepositorio, auditoria),
    anonimizarMeuPerfil: new AnonimizarMeuPerfilCasoDeUso(usuarioRepositorio, hasher, auditoria),
  });
  registrarRotasTimes(app, {
    criarTime: new CriarTimeCasoDeUso(timeRepositorio, auditoria),
    listarTimes: new ListarTimesCasoDeUso(timeRepositorio),
    editarTime: new EditarTimeCasoDeUso(timeRepositorio, auditoria),
    excluirTime: new ExcluirTimeCasoDeUso(timeRepositorio, auditoria),
    adicionarMembro: new AdicionarMembroCasoDeUso(
      timeRepositorio,
      membroTimeRepositorio,
      usuarioRepositorio,
      auditoria,
    ),
    removerMembro: new RemoverMembroCasoDeUso(membroTimeRepositorio, auditoria),
    listarMembros: new ListarMembrosCasoDeUso(timeRepositorio, membroTimeRepositorio),
  });
  registrarRotasTarefas(app, {
    criarTarefa: new CriarTarefaCasoDeUso(tarefaRepositorio, membroTimeRepositorio, auditoria),
    listarTarefas: new ListarTarefasCasoDeUso(tarefaRepositorio, membroTimeRepositorio),
    obterTarefa: new ObterTarefaCasoDeUso(tarefaRepositorio, membroTimeRepositorio),
    editarTarefa: new EditarTarefaCasoDeUso(tarefaRepositorio, auditoria),
    excluirTarefa: new ExcluirTarefaCasoDeUso(tarefaRepositorio, auditoria),
    atribuirTarefa: new AtribuirTarefaCasoDeUso(tarefaRepositorio, membroTimeRepositorio, auditoria),
    listarHistorico: new ListarHistoricoTarefaCasoDeUso(
      tarefaRepositorio,
      membroTimeRepositorio,
      historicoTarefaRepositorio,
    ),
  });

  return app;
}

async function iniciar(): Promise<void> {
  // Fail-fast: lança se DATABASE_URL/MONGODB_URI/JWT_SECRET ausentes.
  const config = carregarConfig();
  const app = construirApp(config);

  try {
    await app.listen({ port: config.porta, host: '0.0.0.0' });
  } catch (erro) {
    app.log.error(erro);
    process.exit(1);
  }
}

// Executa apenas quando rodado diretamente (não em import de teste).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void iniciar();
}
