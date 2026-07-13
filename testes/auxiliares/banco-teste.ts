import { Pool } from 'pg';

/** Pool para testes de integração, com timeout curto para falhar rápido. */
export function obterPoolTeste(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 1500,
  });
}

/**
 * Verifica se há PostgreSQL acessível. Usado para pular (skip) os testes de
 * integração quando não há banco Docker — mantém o gate verde em qualquer host.
 */
export async function bancoDisponivel(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  const pool = obterPoolTeste();
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    await pool.end();
  }
}

/** Limpa todas as tabelas de domínio (uso em beforeEach de testes). */
export async function truncarTabelas(pool: Pool): Promise<void> {
  await pool.query(
    'TRUNCATE tasks_history, tasks, team_members, teams, users RESTART IDENTITY CASCADE',
  );
}
