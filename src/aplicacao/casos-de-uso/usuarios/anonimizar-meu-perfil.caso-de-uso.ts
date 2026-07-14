import { randomUUID } from 'node:crypto';
import type { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import { ErroNaoEncontrado } from '../../../dominio/erros/erros-de-dominio.js';
import type { IUsuarioRepositorio } from '../../../dominio/repositorios/usuario.repositorio.js';
import type { IAuditoriaRepositorio } from '../../../dominio/repositorios/auditoria.repositorio.js';
import type { IHasher } from '../../portas/hasher.js';

export interface EntradaAnonimizarMeuPerfil {
  solicitante: { id: number; papel: PapelUsuario };
}

export class AnonimizarMeuPerfilCasoDeUso {
  constructor(
    private readonly repositorio: IUsuarioRepositorio,
    private readonly hasher: IHasher,
    private readonly auditoria: IAuditoriaRepositorio,
  ) {}

  async executar(entrada: EntradaAnonimizarMeuPerfil): Promise<void> {
    // Valores irreversíveis; hash de valor aleatório impede login futuro.
    const uuid = randomUUID();
    const senhaHash = await this.hasher.gerarHash(randomUUID());

    const anonimizado = await this.repositorio.anonimizar(entrada.solicitante.id, {
      name: 'Usuário anonimizado',
      email: `anonimizado+${uuid}@invalido`,
      senhaHash,
    });
    if (!anonimizado) {
      throw new ErroNaoEncontrado('Usuário não encontrado');
    }

    void this.auditoria.registrar({
      tipo: 'usuario.anonimizado',
      ator: { user_id: entrada.solicitante.id, role: entrada.solicitante.papel },
      recurso: { type: 'user', id: entrada.solicitante.id },
    });
  }
}
