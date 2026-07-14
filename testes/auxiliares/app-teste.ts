import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import { construirApp } from '../../src/main.js';
import { carregarConfig } from '../../src/compartilhado/config.js';
import { fecharPool } from '../../src/infraestrutura/banco/postgres/conexao.js';
import { fecharMongo } from '../../src/infraestrutura/banco/mongo/conexao.js';
import { migrar } from '../../scripts/migrar.js';
import { obterPoolTeste } from './banco-teste.js';

export interface AppDeTeste {
  app: FastifyInstance;
  pool: Pool;
}

/** Sobe a aplicação real contra o banco de teste (migrações aplicadas). */
export async function iniciarAppDeTeste(): Promise<AppDeTeste> {
  const pool = obterPoolTeste();
  await migrar(pool);
  const app = construirApp(carregarConfig());
  await app.ready();
  return { app, pool };
}

/** Encerra app, pool e conexões singleton (PG/Mongo). */
export async function encerrarAppDeTeste({ app, pool }: AppDeTeste): Promise<void> {
  await app.close();
  await pool.end();
  await fecharPool();
  await fecharMongo();
}
