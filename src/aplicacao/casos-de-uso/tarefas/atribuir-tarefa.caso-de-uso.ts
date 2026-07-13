import type { Tarefa } from '../../../dominio/entidades/tarefa.entidade.js';
import { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import {
  ErroDeValidacao,
  ErroNaoEncontrado,
  ErroProibido,
} from '../../../dominio/erros/erros-de-dominio.js';
import type { ITarefaRepositorio } from '../../../dominio/repositorios/tarefa.repositorio.js';
import type { IMembroTimeRepositorio } from '../../../dominio/repositorios/membro-time.repositorio.js';
import type { IAuditoriaRepositorio } from '../../../dominio/repositorios/auditoria.repositorio.js';

export interface EntradaAtribuirTarefa {
  id: number;
  userId: number;
  solicitante: { id: number; papel: PapelUsuario };
}

export class AtribuirTarefaCasoDeUso {
  constructor(
    private readonly tarefas: ITarefaRepositorio,
    private readonly membros: IMembroTimeRepositorio,
    private readonly auditoria: IAuditoriaRepositorio,
  ) {}

  async executar(entrada: EntradaAtribuirTarefa): Promise<Tarefa> {
    // Atribuir é exclusivo de admin.
    if (entrada.solicitante.papel !== PapelUsuario.Admin) {
      throw new ErroProibido('Apenas admin pode atribuir tarefas');
    }

    const tarefa = await this.tarefas.buscarPorId(entrada.id);
    if (!tarefa) {
      throw new ErroNaoEncontrado('Tarefa não encontrada');
    }

    // O responsável deve pertencer ao time da tarefa.
    const pertence = await this.membros.pertence(entrada.userId, tarefa.teamId);
    if (!pertence) {
      throw new ErroDeValidacao('Usuário não pertence ao time da tarefa');
    }

    const atualizada = await this.tarefas.atribuir(entrada.id, entrada.userId);
    if (!atualizada) {
      throw new ErroNaoEncontrado('Tarefa não encontrada');
    }

    void this.auditoria.registrar({
      tipo: 'tarefa.atribuida',
      ator: { user_id: entrada.solicitante.id, role: entrada.solicitante.papel },
      recurso: { type: 'task', id: atualizada.id },
      payload: { assigned_to: entrada.userId },
    });

    return atualizada;
  }
}
