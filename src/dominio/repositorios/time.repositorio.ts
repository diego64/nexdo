import type { Time } from '../entidades/time.entidade.js';

export interface NovoTime {
  name: string;
  description: string | null;
}

export interface DadosTime {
  name: string;
  description: string | null;
}

export interface PaginaTimes {
  dados: Time[];
  total: number;
  pagina: number;
}

export interface ITimeRepositorio {
  criar(dados: NovoTime): Promise<Time>;
  buscarPorId(id: number): Promise<Time | null>;
  listar(pagina: number, limite: number): Promise<PaginaTimes>;
  editar(id: number, dados: DadosTime): Promise<Time | null>;
  excluir(id: number): Promise<boolean>;
}
