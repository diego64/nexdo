import { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import { ErroNaoEncontrado, ErroProibido } from '../../../dominio/erros/erros-de-dominio.js';
import type { ITarefaRepositorio } from '../../../dominio/repositorios/tarefa.repositorio.js';
import type { IAuditoriaRepositorio } from '../../../dominio/repositorios/auditoria.repositorio.js';

export interface EntradaExcluirTarefa {
  id: number;
  solicitante: { id: number; papel: PapelUsuario };
}

export class ExcluirTarefaCasoDeUso {
  constructor(
    private readonly tarefas: ITarefaRepositorio,
    private readonly auditoria: IAuditoriaRepositorio,
  ) {}

  async executar(entrada: EntradaExcluirTarefa): Promise<void> {
    // Excluir é exclusivo de admin.
    if (entrada.solicitante.papel !== PapelUsuario.Admin) {
      throw new ErroProibido('Apenas admin pode excluir tarefas');
    }

    const removido = await this.tarefas.excluir(entrada.id);
    if (!removido) {
      throw new ErroNaoEncontrado('Tarefa não encontrada');
    }

    void this.auditoria.registrar({
      tipo: 'tarefa.removida',
      ator: { user_id: entrada.solicitante.id, role: entrada.solicitante.papel },
      recurso: { type: 'task', id: entrada.id },
      payload: { id: entrada.id },
    });
  }
}
