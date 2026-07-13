import { Pool } from 'pg';

let pool: Pool | undefined;

/**
 * Pool `pg` singleton, lazy. Lê DATABASE_URL do ambiente na primeira chamada.
 */
export function obterPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL não definida — impossível criar pool PostgreSQL');
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function fecharPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
