import type { Pool } from 'pg';
import { Tarefa } from '../../../dominio/entidades/tarefa.entidade.js';
import type { PrioridadeTarefa } from '../../../dominio/enums/prioridade-tarefa.js';
import type { StatusTarefa } from '../../../dominio/enums/status-tarefa.js';
import type {
  DadosTarefa,
  FiltrosTarefa,
  ITarefaRepositorio,
  NovaTarefa,
  PaginaTarefas,
  TransicaoStatus,
} from '../../../dominio/repositorios/tarefa.repositorio.js';

interface LinhaTarefa {
  id: number;
  title: string;
  description: string | null;
  status: StatusTarefa;
  priority: PrioridadeTarefa;
  assigned_to: number | null;
  team_id: number;
  created_at: Date;
  updated_at: Date;
}

function paraEntidade(linha: LinhaTarefa): Tarefa {
  return new Tarefa({
    id: linha.id,
    title: linha.title,
    description: linha.description,
    status: linha.status,
    priority: linha.priority,
    assignedTo: linha.assigned_to,
    teamId: linha.team_id,
    criadoEm: linha.created_at,
    atualizadoEm: linha.updated_at,
  });
}

export class PgTarefaRepositorio implements ITarefaRepositorio {
  constructor(private readonly pool: Pool) {}

  async criar(dados: NovaTarefa): Promise<Tarefa> {
    const { rows } = await this.pool.query<LinhaTarefa>(
      `INSERT INTO tasks (title, description, status, priority, assigned_to, team_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [dados.title, dados.description, dados.status, dados.priority, dados.assignedTo, dados.teamId],
    );
    return paraEntidade(rows[0]);
  }

  async buscarPorId(id: number): Promise<Tarefa | null> {
    const { rows } = await this.pool.query<LinhaTarefa>('SELECT * FROM tasks WHERE id = $1', [id]);
    return rows[0] ? paraEntidade(rows[0]) : null;
  }

  async listar(
    filtros: FiltrosTarefa,
    equipesPermitidas: number[] | null,
    pagina: number,
    limite: number,
  ): Promise<PaginaTarefas> {
    const condicoes: string[] = [];
    const params: unknown[] = [];

    if (equipesPermitidas !== null) {
      params.push(equipesPermitidas);
      condicoes.push(`team_id = ANY($${params.length})`);
    }
    if (filtros.time !== undefined) {
      params.push(filtros.time);
      condicoes.push(`team_id = $${params.length}`);
    }
    if (filtros.status) {
      params.push(filtros.status);
      condicoes.push(`status = $${params.length}`);
    }
    if (filtros.prioridade) {
      params.push(filtros.prioridade);
      condicoes.push(`priority = $${params.length}`);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

    const contagem = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*)::int AS total FROM tasks ${where}`,
      params,
    );

    params.push(limite);
    const pLim = params.length;
    params.push((pagina - 1) * limite);
    const pOff = params.length;

    const lista = await this.pool.query<LinhaTarefa>(
      `SELECT * FROM tasks ${where} ORDER BY id LIMIT $${pLim} OFFSET $${pOff}`,
      params,
    );

    return {
      dados: lista.rows.map(paraEntidade),
      total: Number(contagem.rows[0].total),
      pagina,
    };
  }

  async editar(
    id: number,
    dados: DadosTarefa,
    transicao?: TransicaoStatus,
  ): Promise<Tarefa | null> {
    const sqlUpdate = `UPDATE tasks SET title = $2, description = $3, status = $4, priority = $5
       WHERE id = $1 RETURNING *`;
    const paramsUpdate = [id, dados.title, dados.description, dados.status, dados.priority];

    // Sem mudança de status: UPDATE simples.
    if (!transicao) {
      const { rows } = await this.pool.query<LinhaTarefa>(sqlUpdate, paramsUpdate);
      return rows[0] ? paraEntidade(rows[0]) : null;
    }

    // Com mudança de status: UPDATE tasks + INSERT tasks_history na MESMA transação.
    // Falha no INSERT do histórico faz ROLLBACK da mudança de status.
    const cliente = await this.pool.connect();
    try {
      await cliente.query('BEGIN');
      const { rows } = await cliente.query<LinhaTarefa>(sqlUpdate, paramsUpdate);
      if (!rows[0]) {
        await cliente.query('ROLLBACK');
        return null;
      }
      await cliente.query(
        `INSERT INTO tasks_history (task_id, changed_by, old_status, new_status)
         VALUES ($1, $2, $3, $4)`,
        [id, transicao.changedBy, transicao.oldStatus, transicao.newStatus],
      );
      await cliente.query('COMMIT');
      return paraEntidade(rows[0]);
    } catch (erro) {
      await cliente.query('ROLLBACK');
      throw erro;
    } finally {
      cliente.release();
    }
  }

  async excluir(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }

  async atribuir(id: number, assignedTo: number): Promise<Tarefa | null> {
    const { rows } = await this.pool.query<LinhaTarefa>(
      `UPDATE tasks SET assigned_to = $2 WHERE id = $1 RETURNING *`,
      [id, assignedTo],
    );
    return rows[0] ? paraEntidade(rows[0]) : null;
  }
}
