import type { HistoricoTarefa } from '../../../dominio/entidades/historico-tarefa.entidade.js';
import { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import { ErroNaoEncontrado, ErroProibido } from '../../../dominio/erros/erros-de-dominio.js';
import type { ITarefaRepositorio } from '../../../dominio/repositorios/tarefa.repositorio.js';
import type { IMembroTimeRepositorio } from '../../../dominio/repositorios/membro-time.repositorio.js';
import type { IHistoricoTarefaRepositorio } from '../../../dominio/repositorios/historico-tarefa.repositorio.js';

export interface EntradaListarHistorico {
  taskId: number;
  solicitante: { id: number; papel: PapelUsuario };
}

export class ListarHistoricoTarefaCasoDeUso {
  constructor(
    private readonly tarefas: ITarefaRepositorio,
    private readonly membros: IMembroTimeRepositorio,
    private readonly historico: IHistoricoTarefaRepositorio,
  ) {}

  async executar(entrada: EntradaListarHistorico): Promise<HistoricoTarefa[]> {
    const tarefa = await this.tarefas.buscarPorId(entrada.taskId);
    if (!tarefa) {
      throw new ErroNaoEncontrado('Tarefa não encontrada');
    }

    // Member só vê histórico de tarefas dos seus times.
    if (entrada.solicitante.papel !== PapelUsuario.Admin) {
      const pertence = await this.membros.pertence(entrada.solicitante.id, tarefa.teamId);
      if (!pertence) {
        throw new ErroProibido('Histórico fora dos seus times');
      }
    }

    return this.historico.listarPorTarefa(entrada.taskId);
  }
}
