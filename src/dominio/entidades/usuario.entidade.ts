import { PapelUsuario } from '../enums/papel-usuario.js';

export interface PropsUsuario {
  id: number;
  name: string;
  email: string;
  senhaHash: string;
  papel: PapelUsuario;
  criadoEm: Date;
  atualizadoEm: Date;
}

/** Representação HTTP segura de um usuário — nunca inclui o hash de senha. */
export interface UsuarioPublico {
  id: number;
  name: string;
  email: string;
  role: PapelUsuario;
}

export class Usuario {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly senhaHash: string;
  readonly papel: PapelUsuario;
  readonly criadoEm: Date;
  readonly atualizadoEm: Date;

  constructor(props: PropsUsuario) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.senhaHash = props.senhaHash;
    this.papel = props.papel;
    this.criadoEm = props.criadoEm;
    this.atualizadoEm = props.atualizadoEm;
  }

  /** Projeção segura para respostas — o hash de senha jamais sai daqui. */
  paraResposta(): UsuarioPublico {
    return { id: this.id, name: this.name, email: this.email, role: this.papel };
  }
}
