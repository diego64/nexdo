import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { carregarConfig, type Config } from './compartilhado/config.js';

/**
 * Constrói a instância Fastify com plugins e rotas registrados.
 * Separado de `iniciar()` para permitir testes via `app.inject()` sem abrir socket.
 */
export function construirApp(config: Config): FastifyInstance {
  const app = Fastify({
    logger: config.nodeEnv === 'test' ? false : { level: 'info' },
  });

  app.register(fastifyCors, { origin: config.corsOrigens });
  app.register(fastifyJwt, { secret: config.jwtSecret });

  app.get('/saude', async () => ({ status: 'ok' }));

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
