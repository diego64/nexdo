import type { Usuario } from '../../../dominio/entidades/usuario.entidade.js';
import type { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import { ErroDeConflito, ErroNaoEncontrado } from '../../../dominio/erros/erros-de-dominio.js';
import type { IUsuarioRepositorio } from '../../../dominio/repositorios/usuario.repositorio.js';
import type { IAuditoriaRepositorio } from '../../../dominio/repositorios/auditoria.repositorio.js';

export interface EntradaCorrigirMeuPerfil {
  name?: string;
  email?: string;
  solicitante: { id: number; papel: PapelUsuario };
}

export class CorrigirMeuPerfilCasoDeUso {
  constructor(
    private readonly repositorio: IUsuarioRepositorio,
    private readonly auditoria: IAuditoriaRepositorio,
  ) {}

  async executar(entrada: EntradaCorrigirMeuPerfil): Promise<Usuario> {
    const atual = await this.repositorio.buscarPorId(entrada.solicitante.id);
    if (!atual) {
      throw new ErroNaoEncontrado('Usuário não encontrado');
    }

    const novoEmail = entrada.email ?? atual.email;
    // Revalida unicidade se o e-mail mudou.
    if (novoEmail !== atual.email) {
      const existente = await this.repositorio.buscarPorEmail(novoEmail);
      if (existente && existente.id !== atual.id) {
        throw new ErroDeConflito('E-mail já cadastrado');
      }
    }

    const atualizado = await this.repositorio.atualizarPerfil(atual.id, {
      name: entrada.name ?? atual.name,
      email: novoEmail,
    });
    if (!atualizado) {
      throw new ErroNaoEncontrado('Usuário não encontrado');
    }

    void this.auditoria.registrar({
      tipo: 'usuario.corrigido',
      ator: { user_id: atualizado.id, role: atualizado.papel },
      recurso: { type: 'user', id: atualizado.id },
    });

    return atualizado;
  }
}
