// Valores conforme o ENUM user_role do PostgreSQL (inglês) — nunca traduzir.
export enum PapelUsuario {
  Admin = 'admin',
  Membro = 'member',
}

export const PAPEIS_VALIDOS: readonly PapelUsuario[] = [PapelUsuario.Admin, PapelUsuario.Membro];
