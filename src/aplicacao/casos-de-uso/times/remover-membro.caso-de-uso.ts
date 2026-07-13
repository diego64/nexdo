import type { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import { ErroNaoEncontrado } from '../../../dominio/erros/erros-de-dominio.js';
import type { IMembroTimeRepositorio } from '../../../dominio/repositorios/membro-time.repositorio.js';
import type { IAuditoriaRepositorio } from '../../../dominio/repositorios/auditoria.repositorio.js';

export interface EntradaRemoverMembro {
  teamId: number;
  userId: number;
  solicitante: { id: number; papel: PapelUsuario };
}

export class RemoverMembroCasoDeUso {
  constructor(
    private readonly membros: IMembroTimeRepositorio,
    private readonly auditoria: IAuditoriaRepositorio,
  ) {}

  async executar(entrada: EntradaRemoverMembro): Promise<void> {
    const removido = await this.membros.remover(entrada.userId, entrada.teamId);
    if (!removido) {
      throw new ErroNaoEncontrado('Membro não encontrado no time');
    }

    void this.auditoria.registrar({
      tipo: 'time.membro-removido',
      ator: { user_id: entrada.solicitante.id, role: entrada.solicitante.papel },
      recurso: { type: 'team', id: entrada.teamId },
      payload: { team_id: entrada.teamId, user_id: entrada.userId },
    });
  }
}
