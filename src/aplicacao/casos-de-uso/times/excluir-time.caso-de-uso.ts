import type { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import { ErroNaoEncontrado } from '../../../dominio/erros/erros-de-dominio.js';
import type { ITimeRepositorio } from '../../../dominio/repositorios/time.repositorio.js';
import type { IAuditoriaRepositorio } from '../../../dominio/repositorios/auditoria.repositorio.js';

export interface EntradaExcluirTime {
  id: number;
  solicitante: { id: number; papel: PapelUsuario };
}

export class ExcluirTimeCasoDeUso {
  constructor(
    private readonly repositorio: ITimeRepositorio,
    private readonly auditoria: IAuditoriaRepositorio,
  ) {}

  async executar(entrada: EntradaExcluirTime): Promise<void> {
    // Membros e tarefas do time caem por CASCADE (schema).
    const removido = await this.repositorio.excluir(entrada.id);
    if (!removido) {
      throw new ErroNaoEncontrado('Time não encontrado');
    }

    void this.auditoria.registrar({
      tipo: 'time.removido',
      ator: { user_id: entrada.solicitante.id, role: entrada.solicitante.papel },
      recurso: { type: 'team', id: entrada.id },
      payload: { id: entrada.id },
    });
  }
}
