import type { MembroDoTime } from '../entidades/membro-time.entidade.js';

export interface IMembroTimeRepositorio {
  adicionar(userId: number, teamId: number): Promise<void>;
  remover(userId: number, teamId: number): Promise<boolean>;
  /** Um usuário pertence a um time? (usado em autz fina de listagem). */
  pertence(userId: number, teamId: number): Promise<boolean>;
  listarPorTime(teamId: number): Promise<MembroDoTime[]>;
}
