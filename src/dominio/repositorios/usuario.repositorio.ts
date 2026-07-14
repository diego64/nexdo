import type { Usuario } from '../entidades/usuario.entidade.js';
import type { PapelUsuario } from '../enums/papel-usuario.js';

export interface NovoUsuario {
  name: string;
  email: string;
  senhaHash: string;
  papel: PapelUsuario;
}

export interface DadosPerfil {
  name: string;
  email: string;
}

export interface DadosAnonimizacao {
  name: string;
  email: string;
  senhaHash: string;
}

export interface IUsuarioRepositorio {
  criar(dados: NovoUsuario): Promise<Usuario>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: number): Promise<Usuario | null>;
  /** Atualiza name/email do titular (LGPD — correção). */
  atualizarPerfil(id: number, dados: DadosPerfil): Promise<Usuario | null>;
  /** Anonimiza o titular preservando o id (LGPD — eliminação). */
  anonimizar(id: number, dados: DadosAnonimizacao): Promise<boolean>;
}
