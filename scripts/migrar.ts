import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Pool } from 'pg';
import { obterPool, fecharPool } from '../src/infraestrutura/banco/postgres/conexao.js';

const DIR_MIGRACOES = join(dirname(fileURLToPath(import.meta.url)), '..', 'database');

/**
 * Aplica os `.sql` de `database/` em ordem, uma vez cada, controlando por
 * `schema_migrations`. Idempotente: rodar de novo não reaplica nada.
 * Retorna a lista de arquivos aplicados nesta execução.
 */
export async function migrar(pool: Pool): Promise<string[]> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `);

  const arquivos = (await readdir(DIR_MIGRACOES)).filter((f) => f.endsWith('.sql')).sort();

  const { rows } = await pool.query<{ filename: string }>('SELECT filename FROM schema_migrations');
  const aplicadas = new Set(rows.map((r) => r.filename));

  const novas: string[] = [];
  for (const arquivo of arquivos) {
    if (aplicadas.has(arquivo)) continue;

    const sql = await readFile(join(DIR_MIGRACOES, arquivo), 'utf8');
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      await cliente.query(sql);
      await cliente.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [arquivo]);
      await cliente.query('COMMIT');
      novas.push(arquivo);
    } catch (erro) {
      await cliente.query('ROLLBACK');
      throw erro;
    } finally {
      cliente.release();
    }
  }
  return novas;
}

async function principal(): Promise<void> {
  const pool = obterPool();
  try {
    const novas = await migrar(pool);
    console.log(
      novas.length === 0 ? 'Nenhuma migração pendente.' : `Aplicadas: ${novas.join(', ')}`,
    );
  } finally {
    await fecharPool();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch((erro) => {
    console.error(erro);
    process.exit(1);
  });
}
