import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import bcrypt from 'bcrypt';
import type { Pool } from 'pg';
import { obterPool, fecharPool } from '../src/infraestrutura/banco/postgres/conexao.js';

const CUSTO_BCRYPT = 10; // CLAUDE.md §2

const ADMIN = {
  name: 'administrador',
  email: 'administrador@nexdo.local',
  // Senha local do CLAUDE.md §7; sobrescrevível por env em produção.
  senha: process.env.SEED_ADMIN_PASSWORD ?? '1qaz2wsx12',
};

/**
 * Cria o usuário administrador padrão. Idempotente: se o e-mail já existe,
 * não faz nada (ON CONFLICT). Retorna true se inseriu.
 */
export async function semear(pool: Pool): Promise<boolean> {
  const hash = await bcrypt.hash(ADMIN.senha, CUSTO_BCRYPT);
  const { rowCount } = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [ADMIN.name, ADMIN.email, hash],
  );
  return rowCount === 1;
}

async function principal(): Promise<void> {
  const pool = obterPool();
  try {
    const inseriu = await semear(pool);
    console.log(inseriu ? 'Administrador criado.' : 'Administrador já existia — nada a fazer.');
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
