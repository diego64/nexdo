import { describe, it, expect, vi } from 'vitest';
import type { FastifyRequest } from 'fastify';
import { autenticar } from '../../src/infraestrutura/http/middlewares/autenticacao.middleware.js';
import { exigirPapel } from '../../src/infraestrutura/http/middlewares/autorizacao.middleware.js';
import { PapelUsuario } from '../../src/dominio/enums/papel-usuario.js';
import { ErroNaoAutorizado, ErroProibido } from '../../src/dominio/erros/erros-de-dominio.js';

describe('Funcionalidade: Autorização', () => {
  it('deve lançar 401 quando não há token válido', async () => {
    const request = {
      jwtVerify: vi.fn().mockRejectedValue(new Error('sem token')),
    } as unknown as FastifyRequest;

    await expect(autenticar(request)).rejects.toBeInstanceOf(ErroNaoAutorizado);
  });

  it('deve injetar request.usuario a partir do payload do JWT', async () => {
    // @fastify/jwt popula request.user como efeito de jwtVerify(); replicamos.
    const request = {
      jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
        request.user = { sub: 42, role: PapelUsuario.Admin };
      }),
    } as unknown as FastifyRequest;

    await autenticar(request);

    expect(request.usuario).toEqual({ id: 42, papel: PapelUsuario.Admin });
  });

  it('deve lançar 403 quando member acessa rota exclusiva de admin', async () => {
    const request = {
      usuario: { id: 1, papel: PapelUsuario.Membro },
    } as unknown as FastifyRequest;

    await expect(exigirPapel(PapelUsuario.Admin)(request)).rejects.toBeInstanceOf(ErroProibido);
  });

  it('deve permitir quando o papel do usuário está autorizado', async () => {
    const request = {
      usuario: { id: 1, papel: PapelUsuario.Admin },
    } as unknown as FastifyRequest;

    await expect(exigirPapel(PapelUsuario.Admin)(request)).resolves.toBeUndefined();
  });
});
