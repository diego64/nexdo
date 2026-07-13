import type { Tarefa } from '../../../dominio/entidades/tarefa.entidade.js';
import { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import type { PrioridadeTarefa } from '../../../dominio/enums/prioridade-tarefa.js';
import type { StatusTarefa } from '../../../dominio/enums/status-tarefa.js';
import { ErroNaoEncontrado, ErroProibido } from '../../../dominio/erros/erros-de-dominio.js';
import type { ITarefaRepositorio } from '../../../dominio/repositorios/tarefa.repositorio.js';
import type { IAuditoriaRepositorio } from '../../../dominio/repositorios/auditoria.repositorio.js';

export interface DadosEdicaoTarefa {
  title?: string;
  description?: string | null;
  status?: StatusTarefa;
  priority?: PrioridadeTarefa;
}

export interface EntradaEditarTarefa {
  id: number;
  dados: DadosEdicaoTarefa;
  solicitante: { id: number; papel: PapelUsuario };
}

export class EditarTarefaCasoDeUso {
  constructor(
    private readonly tarefas: ITarefaRepositorio,
    private readonly auditoria: IAuditoriaRepositorio,
  ) {}

  async executar(entrada: EntradaEditarTarefa): Promise<Tarefa> {
    const atual = await this.tarefas.buscarPorId(entrada.id);
    if (!atual) {
      throw new ErroNaoEncontrado('Tarefa não encontrada');
    }

    // Member só edita tarefa atribuída a si.
    if (
      entrada.solicitante.papel !== PapelUsuario.Admin &&
      atual.assignedTo !== entrada.solicitante.id
    ) {
      throw new ErroProibido('Você só pode editar tarefas atribuídas a você');
    }

    const { dados } = entrada;
    const atualizada = await this.tarefas.editar(entrada.id, {
      title: dados.title ?? atual.title,
      description: dados.description !== undefined ? dados.description : atual.description,
      status: dados.status ?? atual.status,
      priority: dados.priority ?? atual.priority,
    });
    if (!atualizada) {
      throw new ErroNaoEncontrado('Tarefa não encontrada');
    }

    // Nota: o registro de tasks_history na mudança de status é da SPEC 06
    // (mesma transação). Aqui só auditamos a atualização.
    void this.auditoria.registrar({
      tipo: 'tarefa.atualizada',
      ator: { user_id: entrada.solicitante.id, role: entrada.solicitante.papel },
      recurso: { type: 'task', id: atualizada.id },
      payload: { ...atualizada.paraResposta() },
    });

    return atualizada;
  }
}
