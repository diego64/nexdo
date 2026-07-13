import type { ITimeRepositorio, PaginaTimes } from '../../../dominio/repositorios/time.repositorio.js';

export interface EntradaListarTimes {
  pagina: number;
  limite: number;
}

export class ListarTimesCasoDeUso {
  constructor(private readonly repositorio: ITimeRepositorio) {}

  executar(entrada: EntradaListarTimes): Promise<PaginaTimes> {
    return this.repositorio.listar(entrada.pagina, entrada.limite);
  }
}
