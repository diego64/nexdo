import type { Pool } from 'pg';
import { Time } from '../../../dominio/entidades/time.entidade.js';
import type {
  DadosTime,
  ITimeRepositorio,
  NovoTime,
  PaginaTimes,
} from '../../../dominio/repositorios/time.repositorio.js';

interface LinhaTime {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

function paraEntidade(linha: LinhaTime): Time {
  return new Time({
    id: linha.id,
    name: linha.name,
    description: linha.description,
    criadoEm: linha.created_at,
    atualizadoEm: linha.updated_at,
  });
}

export class PgTimeRepositorio implements ITimeRepositorio {
  constructor(private readonly pool: Pool) {}

  async criar(dados: NovoTime): Promise<Time> {
    const { rows } = await this.pool.query<LinhaTime>(
      `INSERT INTO teams (name, description) VALUES ($1, $2) RETURNING *`,
      [dados.name, dados.description],
    );
    return paraEntidade(rows[0]);
  }

  async buscarPorId(id: number): Promise<Time | null> {
    const { rows } = await this.pool.query<LinhaTime>('SELECT * FROM teams WHERE id = $1', [id]);
    return rows[0] ? paraEntidade(rows[0]) : null;
  }

  async listar(pagina: number, limite: number): Promise<PaginaTimes> {
    const offset = (pagina - 1) * limite;
    const [lista, contagem] = await Promise.all([
      this.pool.query<LinhaTime>('SELECT * FROM teams ORDER BY id LIMIT $1 OFFSET $2', [
        limite,
        offset,
      ]),
      this.pool.query<{ total: string }>('SELECT COUNT(*)::int AS total FROM teams'),
    ]);
    return {
      dados: lista.rows.map(paraEntidade),
      total: Number(contagem.rows[0].total),
      pagina,
    };
  }

  async editar(id: number, dados: DadosTime): Promise<Time | null> {
    const { rows } = await this.pool.query<LinhaTime>(
      `UPDATE teams SET name = $2, description = $3 WHERE id = $1 RETURNING *`,
      [id, dados.name, dados.description],
    );
    return rows[0] ? paraEntidade(rows[0]) : null;
  }

  async excluir(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query('DELETE FROM teams WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }
}
