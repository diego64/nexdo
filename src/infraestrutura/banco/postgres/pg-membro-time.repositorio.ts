import type { Pool } from 'pg';
import type { MembroDoTime } from '../../../dominio/entidades/membro-time.entidade.js';
import type { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import type { IMembroTimeRepositorio } from '../../../dominio/repositorios/membro-time.repositorio.js';

interface LinhaMembro {
  user_id: number;
  name: string;
  email: string;
  role: PapelUsuario;
}

export class PgMembroTimeRepositorio implements IMembroTimeRepositorio {
  constructor(private readonly pool: Pool) {}

  async adicionar(userId: number, teamId: number): Promise<void> {
    await this.pool.query('INSERT INTO team_members (user_id, team_id) VALUES ($1, $2)', [
      userId,
      teamId,
    ]);
  }

  async remover(userId: number, teamId: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'DELETE FROM team_members WHERE user_id = $1 AND team_id = $2',
      [userId, teamId],
    );
    return (rowCount ?? 0) > 0;
  }

  async pertence(userId: number, teamId: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'SELECT 1 FROM team_members WHERE user_id = $1 AND team_id = $2 LIMIT 1',
      [userId, teamId],
    );
    return (rowCount ?? 0) > 0;
  }

  async timesDoUsuario(userId: number): Promise<number[]> {
    const { rows } = await this.pool.query<{ team_id: number }>(
      'SELECT team_id FROM team_members WHERE user_id = $1',
      [userId],
    );
    return rows.map((r) => r.team_id);
  }

  async listarPorTime(teamId: number): Promise<MembroDoTime[]> {
    const { rows } = await this.pool.query<LinhaMembro>(
      `SELECT u.id AS user_id, u.name, u.email, u.role
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1
       ORDER BY u.name`,
      [teamId],
    );
    return rows;
  }
}
