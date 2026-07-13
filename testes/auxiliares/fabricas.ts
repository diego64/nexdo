import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import { BcryptHasher } from '../../src/infraestrutura/seguranca/bcrypt-hasher.js';

const hasher = new BcryptHasher();

export interface DadosUsuarioFabrica {
  name?: string;
  email: string;
  senha?: string;
  role?: 'admin' | 'member';
}

/** Insere um usuário diretamente no PG (com hash bcrypt) e retorna o id. */
export async function criarUsuarioDireto(pool: Pool, dados: DadosUsuarioFabrica): Promise<number> {
  const hash = await hasher.gerarHash(dados.senha ?? 'senha1234');
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [dados.name ?? 'Usuário', dados.email, hash, dados.role ?? 'member'],
  );
  return rows[0].id;
}

/** Faz login via HTTP e devolve o token JWT. */
export async function obterToken(
  app: FastifyInstance,
  email: string,
  senha = 'senha1234',
): Promise<string> {
  const resp = await app.inject({
    method: 'POST',
    url: '/sessoes',
    payload: { email, password: senha },
  });
  return resp.json().token as string;
}

export function auth(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}
