import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import { BcryptHasher } from '../../src/infraestrutura/seguranca/bcrypt-hasher.js';
import { StatusTarefa } from '../../src/dominio/enums/status-tarefa.js';
import { PrioridadeTarefa } from '../../src/dominio/enums/prioridade-tarefa.js';

const hasher = new BcryptHasher();

export interface DadosUsuarioFabrica {
  name?: string;
  email: string;
  senha?: string;
  role?: 'admin' | 'member';
}

/** Insere um usuário diretamente no PG (com hash bcrypt) e retorna o id. */
export async function fabricarUsuario(pool: Pool, dados: DadosUsuarioFabrica): Promise<number> {
  const hash = await hasher.gerarHash(dados.senha ?? 'senha1234');
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [dados.name ?? 'Usuário', dados.email, hash, dados.role ?? 'member'],
  );
  return rows[0].id;
}

/** Insere um time diretamente no PG e retorna o id. */
export async function fabricarTime(
  pool: Pool,
  dados: { name?: string; description?: string | null } = {},
): Promise<number> {
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO teams (name, description) VALUES ($1, $2) RETURNING id`,
    [dados.name ?? 'Time', dados.description ?? null],
  );
  return rows[0].id;
}

export interface DadosTarefaFabrica {
  teamId: number;
  title?: string;
  status?: StatusTarefa;
  priority?: PrioridadeTarefa;
  assignedTo?: number | null;
}

/** Insere uma tarefa diretamente no PG e retorna o id. */
export async function fabricarTarefa(pool: Pool, dados: DadosTarefaFabrica): Promise<number> {
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO tasks (title, status, priority, assigned_to, team_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [
      dados.title ?? 'Tarefa',
      dados.status ?? StatusTarefa.Pendente,
      dados.priority ?? PrioridadeTarefa.Media,
      dados.assignedTo ?? null,
      dados.teamId,
    ],
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
