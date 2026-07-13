import type { PapelUsuario } from '../enums/papel-usuario.js';

/** Membro de um time, já com os dados do usuário (projeção para listagem). */
export interface MembroDoTime {
  user_id: number;
  name: string;
  email: string;
  role: PapelUsuario;
}
