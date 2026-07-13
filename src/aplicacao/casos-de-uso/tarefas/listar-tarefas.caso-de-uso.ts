import { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import type {
  FiltrosTarefa,
  ITarefaRepositorio,
  PaginaTarefas,
} from '../../../dominio/repositorios/tarefa.repositorio.js';
import type { IMembroTimeRepositorio } from '../../../dominio/repositorios/membro-time.repositorio.js';

export interface EntradaListarTarefas {
  filtros: FiltrosTarefa;
  pagina: number;
  limite: number;
  solicitante: { id: number; papel: PapelUsuario };
}

export class ListarTarefasCasoDeUso {
  constructor(
    private readonly tarefas: ITarefaRepositorio,
    private readonly membros: IMembroTimeRepositorio,
  ) {}

  async executar(entrada: EntradaListarTarefas): Promise<PaginaTarefas> {
    // Admin vê todas; member só dos times a que pertence.
    const equipesPermitidas =
      entrada.solicitante.papel === PapelUsuario.Admin
        ? null
        : await this.membros.timesDoUsuario(entrada.solicitante.id);

    return this.tarefas.listar(entrada.filtros, equipesPermitidas, entrada.pagina, entrada.limite);
  }
}
