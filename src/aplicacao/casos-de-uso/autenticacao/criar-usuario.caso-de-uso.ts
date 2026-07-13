import { Usuario } from '../../../dominio/entidades/usuario.entidade.js';
import { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import { ErroDeConflito } from '../../../dominio/erros/erros-de-dominio.js';
import type { IUsuarioRepositorio } from '../../../dominio/repositorios/usuario.repositorio.js';
import type { IAuditoriaRepositorio } from '../../../dominio/repositorios/auditoria.repositorio.js';
import type { IHasher } from '../../portas/hasher.js';

export interface EntradaCriarUsuario {
  name: string;
  email: string;
  senha: string;
}

export class CriarUsuarioCasoDeUso {
  constructor(
    private readonly repositorio: IUsuarioRepositorio,
    private readonly hasher: IHasher,
    private readonly auditoria: IAuditoriaRepositorio,
  ) {}

  async executar(entrada: EntradaCriarUsuario): Promise<Usuario> {
    const existente = await this.repositorio.buscarPorEmail(entrada.email);
    if (existente) {
      throw new ErroDeConflito('E-mail já cadastrado');
    }

    const senhaHash = await this.hasher.gerarHash(entrada.senha);
    const usuario = await this.repositorio.criar({
      name: entrada.name,
      email: entrada.email,
      senhaHash,
      papel: PapelUsuario.Membro, // papel padrão
    });

    void this.auditoria.registrar({
      tipo: 'usuario.criado',
      ator: { user_id: usuario.id, role: usuario.papel },
      recurso: { type: 'user', id: usuario.id },
      payload: { email: usuario.email, role: usuario.papel },
    });

    return usuario;
  }
}
