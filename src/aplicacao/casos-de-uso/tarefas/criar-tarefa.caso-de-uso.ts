import type { Tarefa } from '../../../dominio/entidades/tarefa.entidade.js';
import { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import type { PrioridadeTarefa } from '../../../dominio/enums/prioridade-tarefa.js';
import type { StatusTarefa } from '../../../dominio/enums/status-tarefa.js';
import { ErroDeValidacao, ErroProibido } from '../../../dominio/erros/erros-de-dominio.js';
import type { ITarefaRepositorio } from '../../../dominio/repositorios/tarefa.repositorio.js';
import type { IMembroTimeRepositorio } from '../../../dominio/repositorios/membro-time.repositorio.js';
import type { IAuditoriaRepositorio } from '../../../dominio/repositorios/auditoria.repositorio.js';

export interface EntradaCriarTarefa {
  title: string;
  description: string | null;
  status: StatusTarefa;
  priority: PrioridadeTarefa;
  assignedTo: number | null;
  teamId: number;
  solicitante: { id: number; papel: PapelUsuario };
}

export class CriarTarefaCasoDeUso {
  constructor(
    private readonly tarefas: ITarefaRepositorio,
    private readonly membros: IMembroTimeRepositorio,
    private readonly auditoria: IAuditoriaRepositorio,
  ) {}

  async executar(entrada: EntradaCriarTarefa): Promise<Tarefa> {
    // Member só cria no time ao qual pertence.
    if (entrada.solicitante.papel !== PapelUsuario.Admin) {
      const pertence = await this.membros.pertence(entrada.solicitante.id, entrada.teamId);
      if (!pertence) {
        throw new ErroProibido('Você não pertence a este time');
      }
    }

    // Se atribuída na criação, o responsável deve pertencer ao time.
    if (entrada.assignedTo !== null) {
      const responsavelNoTime = await this.membros.pertence(entrada.assignedTo, entrada.teamId);
      if (!responsavelNoTime) {
        throw new ErroDeValidacao('Responsável não pertence ao time da tarefa');
      }
    }

    const tarefa = await this.tarefas.criar({
      title: entrada.title,
      description: entrada.description,
      status: entrada.status,
      priority: entrada.priority,
      assignedTo: entrada.assignedTo,
      teamId: entrada.teamId,
    });

    void this.auditoria.registrar({
      tipo: 'tarefa.criada',
      ator: { user_id: entrada.solicitante.id, role: entrada.solicitante.papel },
      recurso: { type: 'task', id: tarefa.id },
      payload: { ...tarefa.paraResposta() },
    });

    return tarefa;
  }
}
