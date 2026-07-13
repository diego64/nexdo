import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { ErroDeDominio } from '../../../dominio/erros/erros-de-dominio.js';

interface EnvelopeErro {
  erro: { codigo: string; mensagem: string; detalhes?: unknown };
}

function envelope(codigo: string, mensagem: string, detalhes?: unknown): EnvelopeErro {
  return { erro: { codigo, mensagem, ...(detalhes !== undefined ? { detalhes } : {}) } };
}

/** Tratador global: erros de domínio e Zod → status/envelope; resto → 500. */
export function tratadorDeErros(
  erro: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (erro instanceof ZodError) {
    reply.status(400).send(envelope('validacao', 'Dados inválidos', erro.flatten()));
    return;
  }

  if (erro instanceof ErroDeDominio) {
    reply.status(erro.status).send(envelope(erro.codigo, erro.message, erro.detalhes));
    return;
  }

  request.log.error(erro);
  reply.status(500).send(envelope('interno', 'Erro interno do servidor'));
}
