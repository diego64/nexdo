import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { carregarConfig, type Config } from './compartilhado/config.js';
import { obterPool } from './infraestrutura/banco/postgres/conexao.js';
import { PgUsuarioRepositorio } from './infraestrutura/banco/postgres/pg-usuario.repositorio.js';
import { MongoAuditoriaRepositorio } from './infraestrutura/banco/mongo/mongo-auditoria.repositorio.js';
import { BcryptHasher } from './infraestrutura/seguranca/bcrypt-hasher.js';
import { CriarUsuarioCasoDeUso } from './aplicacao/casos-de-uso/autenticacao/criar-usuario.caso-de-uso.js';
import { AutenticarUsuarioCasoDeUso } from './aplicacao/casos-de-uso/autenticacao/autenticar-usuario.caso-de-uso.js';
import { tratadorDeErros } from './infraestrutura/http/middlewares/erros.middleware.js';
import { registrarRotasAutenticacao } from './infraestrutura/http/rotas/autenticacao.rotas.js';

/**
 * Composition root: instancia dependências (injeção manual) e registra rotas.
 * Separado de `iniciar()` para permitir testes via `app.inject()`.
 */
export function construirApp(config: Config): FastifyInstance {
  const app = Fastify({
    logger: config.nodeEnv === 'test' ? false : { level: 'info' },
  });

  app.register(fastifyCors, { origin: config.corsOrigens });
  app.register(fastifyJwt, {
    secret: config.jwtSecret,
    sign: { expiresIn: config.jwtExpiracao },
  });

  app.setErrorHandler(tratadorDeErros);

  // --- Injeção de dependências (manual, sem container) ---
  const pool = obterPool();
  const usuarioRepositorio = new PgUsuarioRepositorio(pool);
  const auditoria = new MongoAuditoriaRepositorio();
  const hasher = new BcryptHasher();

  const criarUsuario = new CriarUsuarioCasoDeUso(usuarioRepositorio, hasher, auditoria);
  const autenticar = new AutenticarUsuarioCasoDeUso(usuarioRepositorio, hasher, auditoria);

  // --- Rotas ---
  app.get('/saude', async () => ({ status: 'ok' }));
  registrarRotasAutenticacao(app, { criarUsuario, autenticar });

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
