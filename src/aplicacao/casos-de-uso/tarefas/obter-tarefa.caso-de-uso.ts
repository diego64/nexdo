import type { Tarefa } from '../../../dominio/entidades/tarefa.entidade.js';
import { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import { ErroNaoEncontrado, ErroProibido } from '../../../dominio/erros/erros-de-dominio.js';
import type { ITarefaRepositorio } from '../../../dominio/repositorios/tarefa.repositorio.js';
import type { IMembroTimeRepositorio } from '../../../dominio/repositorios/membro-time.repositorio.js';

export interface EntradaObterTarefa {
  id: number;
  solicitante: { id: number; papel: PapelUsuario };
}

export class ObterTarefaCasoDeUso {
  constructor(
    private readonly tarefas: ITarefaRepositorio,
    private readonly membros: IMembroTimeRepositorio,
  ) {}

  async executar(entrada: EntradaObterTarefa): Promise<Tarefa> {
    const tarefa = await this.tarefas.buscarPorId(entrada.id);
    if (!tarefa) {
      throw new ErroNaoEncontrado('Tarefa não encontrada');
    }

    // Member só acessa tarefas dos seus times.
    if (entrada.solicitante.papel !== PapelUsuario.Admin) {
      const pertence = await this.membros.pertence(entrada.solicitante.id, tarefa.teamId);
      if (!pertence) {
        throw new ErroProibido('Tarefa fora dos seus times');
      }
    }

    return tarefa;
  }
}
