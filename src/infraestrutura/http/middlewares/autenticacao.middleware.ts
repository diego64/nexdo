import type { FastifyRequest } from 'fastify';
import { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import { ErroNaoAutorizado } from '../../../dominio/erros/erros-de-dominio.js';

export interface UsuarioAutenticado {
  id: number;
  papel: PapelUsuario;
}

// Tipa o payload/user do @fastify/jwt e injeta `request.usuario`.
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: number; role: PapelUsuario };
    user: { sub: number; role: PapelUsuario };
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    usuario?: UsuarioAutenticado;
  }
}

/** preHandler: valida o JWT do header Authorization e injeta `request.usuario`. */
export async function autenticar(request: FastifyRequest): Promise<void> {
  try {
    await request.jwtVerify();
    // `request.user` é tipado pela augmentation de FastifyJWT abaixo.
    request.usuario = { id: Number(request.user.sub), papel: request.user.role };
  } catch {
    throw new ErroNaoAutorizado('Token ausente ou inválido');
  }
}
