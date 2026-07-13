import type { Pool } from 'pg';
import { Usuario } from '../../../dominio/entidades/usuario.entidade.js';
import type { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import type {
  IUsuarioRepositorio,
  NovoUsuario,
} from '../../../dominio/repositorios/usuario.repositorio.js';

interface LinhaUsuario {
  id: number;
  name: string;
  email: string;
  password: string;
  role: PapelUsuario;
  created_at: Date;
  updated_at: Date;
}

function paraEntidade(linha: LinhaUsuario): Usuario {
  return new Usuario({
    id: linha.id,
    name: linha.name,
    email: linha.email,
    senhaHash: linha.password,
    papel: linha.role,
    criadoEm: linha.created_at,
    atualizadoEm: linha.updated_at,
  });
}

export class PgUsuarioRepositorio implements IUsuarioRepositorio {
  constructor(private readonly pool: Pool) {}

  async criar(dados: NovoUsuario): Promise<Usuario> {
    const { rows } = await this.pool.query<LinhaUsuario>(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [dados.name, dados.email, dados.senhaHash, dados.papel],
    );
    return paraEntidade(rows[0]);
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query<LinhaUsuario>(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    return rows[0] ? paraEntidade(rows[0]) : null;
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    const { rows } = await this.pool.query<LinhaUsuario>('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ? paraEntidade(rows[0]) : null;
  }
}
