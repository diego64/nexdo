import type { MembroDoTime } from '../../../dominio/entidades/membro-time.entidade.js';
import { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import { ErroNaoEncontrado, ErroProibido } from '../../../dominio/erros/erros-de-dominio.js';
import type { ITimeRepositorio } from '../../../dominio/repositorios/time.repositorio.js';
import type { IMembroTimeRepositorio } from '../../../dominio/repositorios/membro-time.repositorio.js';

export interface EntradaListarMembros {
  teamId: number;
  solicitante: { id: number; papel: PapelUsuario };
}

export class ListarMembrosCasoDeUso {
  constructor(
    private readonly times: ITimeRepositorio,
    private readonly membros: IMembroTimeRepositorio,
  ) {}

  async executar(entrada: EntradaListarMembros): Promise<MembroDoTime[]> {
    // Autz fina (CLAUDE.md §6): admin vê qualquer time; member só o próprio.
    if (entrada.solicitante.papel !== PapelUsuario.Admin) {
      const pertence = await this.membros.pertence(entrada.solicitante.id, entrada.teamId);
      if (!pertence) {
        throw new ErroProibido('Você não pertence a este time');
      }
    }

    const time = await this.times.buscarPorId(entrada.teamId);
    if (!time) {
      throw new ErroNaoEncontrado('Time não encontrado');
    }

    return this.membros.listarPorTime(entrada.teamId);
  }
}
