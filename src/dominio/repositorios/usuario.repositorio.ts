import type { Usuario } from '../entidades/usuario.entidade.js';
import type { PapelUsuario } from '../enums/papel-usuario.js';

export interface NovoUsuario {
  name: string;
  email: string;
  senhaHash: string;
  papel: PapelUsuario;
}

export interface IUsuarioRepositorio {
  criar(dados: NovoUsuario): Promise<Usuario>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: number): Promise<Usuario | null>;
}
