import type { Usuario } from '../../../dominio/entidades/usuario.entidade.js';
import type { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import { ErroNaoEncontrado } from '../../../dominio/erros/erros-de-dominio.js';
import type { IUsuarioRepositorio } from '../../../dominio/repositorios/usuario.repositorio.js';
import type { IAuditoriaRepositorio } from '../../../dominio/repositorios/auditoria.repositorio.js';

export interface EntradaObterMeuPerfil {
  solicitante: { id: number; papel: PapelUsuario };
}

export class ObterMeuPerfilCasoDeUso {
  constructor(
    private readonly repositorio: IUsuarioRepositorio,
    private readonly auditoria: IAuditoriaRepositorio,
  ) {}

  async executar(entrada: EntradaObterMeuPerfil): Promise<Usuario> {
    const usuario = await this.repositorio.buscarPorId(entrada.solicitante.id);
    if (!usuario) {
      throw new ErroNaoEncontrado('Usuário não encontrado');
    }

    void this.auditoria.registrar({
      tipo: 'usuario.acessado',
      ator: { user_id: usuario.id, role: usuario.papel },
      recurso: { type: 'user', id: usuario.id },
    });

    return usuario;
  }
}
