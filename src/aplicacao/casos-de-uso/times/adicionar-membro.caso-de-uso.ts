import type { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import { ErroDeConflito, ErroNaoEncontrado } from '../../../dominio/erros/erros-de-dominio.js';
import type { ITimeRepositorio } from '../../../dominio/repositorios/time.repositorio.js';
import type { IMembroTimeRepositorio } from '../../../dominio/repositorios/membro-time.repositorio.js';
import type { IUsuarioRepositorio } from '../../../dominio/repositorios/usuario.repositorio.js';
import type { IAuditoriaRepositorio } from '../../../dominio/repositorios/auditoria.repositorio.js';

export interface EntradaAdicionarMembro {
  teamId: number;
  userId: number;
  solicitante: { id: number; papel: PapelUsuario };
}

export class AdicionarMembroCasoDeUso {
  constructor(
    private readonly times: ITimeRepositorio,
    private readonly membros: IMembroTimeRepositorio,
    private readonly usuarios: IUsuarioRepositorio,
    private readonly auditoria: IAuditoriaRepositorio,
  ) {}

  async executar(entrada: EntradaAdicionarMembro): Promise<void> {
    const time = await this.times.buscarPorId(entrada.teamId);
    if (!time) {
      throw new ErroNaoEncontrado('Time não encontrado');
    }
    const usuario = await this.usuarios.buscarPorId(entrada.userId);
    if (!usuario) {
      throw new ErroNaoEncontrado('Usuário não encontrado');
    }
    if (await this.membros.pertence(entrada.userId, entrada.teamId)) {
      throw new ErroDeConflito('Usuário já é membro do time');
    }

    await this.membros.adicionar(entrada.userId, entrada.teamId);

    void this.auditoria.registrar({
      tipo: 'time.membro-adicionado',
      ator: { user_id: entrada.solicitante.id, role: entrada.solicitante.papel },
      recurso: { type: 'team', id: entrada.teamId },
      payload: { team_id: entrada.teamId, user_id: entrada.userId },
    });
  }
}
