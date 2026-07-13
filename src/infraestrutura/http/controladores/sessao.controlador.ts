import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AutenticarUsuarioCasoDeUso } from '../../../aplicacao/casos-de-uso/autenticacao/autenticar-usuario.caso-de-uso.js';
import { autenticarEsquema } from '../esquemas/autenticar.esquema.js';

export function autenticarControlador(caso: AutenticarUsuarioCasoDeUso) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const dados = autenticarEsquema.parse(request.body);
    const usuario = await caso.executar({ email: dados.email, senha: dados.password });

    // Emissão do JWT é responsabilidade da borda HTTP (payload mínimo).
    const token = await reply.jwtSign({ sub: usuario.id, role: usuario.papel });

    reply.status(200).send({ token, usuario: usuario.paraResposta() });
  };
}
