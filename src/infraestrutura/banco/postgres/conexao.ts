import { Pool, type PoolConfig } from 'pg';

let pool: Pool | undefined;

/**
 * Decide se o pool usa SSL. Supabase (produção) exige TLS; ativamos em produção
 * ou quando DATABASE_SSL=true. Local/CI (Postgres em Docker) não usa SSL.
 */
export function deveUsarSSL(): boolean {
  return process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production';
}

/**
 * Pool `pg` singleton, lazy. Lê DATABASE_URL do ambiente na primeira chamada.
 */
export function obterPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL não definida — impossível criar pool PostgreSQL');
    }
    const config: PoolConfig = { connectionString };
    if (deveUsarSSL()) {
      // Supabase apresenta certificado gerenciado; não validamos a cadeia.
      config.ssl = { rejectUnauthorized: false };
    }
    pool = new Pool(config);
  }
  return pool;
}

export async function fecharPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
