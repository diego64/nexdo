import { describe, it, expect, vi } from 'vitest';
import { AutenticarUsuarioCasoDeUso } from '../../src/aplicacao/casos-de-uso/autenticacao/autenticar-usuario.caso-de-uso.js';
import { Usuario } from '../../src/dominio/entidades/usuario.entidade.js';
import { PapelUsuario } from '../../src/dominio/enums/papel-usuario.js';
import { ErroNaoAutorizado } from '../../src/dominio/erros/erros-de-dominio.js';
import type { IUsuarioRepositorio } from '../../src/dominio/repositorios/usuario.repositorio.js';
import type { IAuditoriaRepositorio } from '../../src/dominio/repositorios/auditoria.repositorio.js';
import type { IHasher } from '../../src/aplicacao/portas/hasher.js';

function usuarioFake(): Usuario {
  return new Usuario({
    id: 7,
    name: 'Bia',
    email: 'bia@a.com',
    senhaHash: 'hash',
    papel: PapelUsuario.Membro,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  });
}

describe('Funcionalidade: Login', () => {
  it('deve autenticar e registrar sessao.iniciada quando as credenciais batem', async () => {
    const repositorio: IUsuarioRepositorio = {
      buscarPorEmail: vi.fn().mockResolvedValue(usuarioFake()),
      buscarPorId: vi.fn(),
      criar: vi.fn(),
    };
    const hasher: IHasher = { gerarHash: vi.fn(), comparar: vi.fn().mockResolvedValue(true) };
    const auditoria: IAuditoriaRepositorio = { registrar: vi.fn().mockResolvedValue(undefined) };
    const caso = new AutenticarUsuarioCasoDeUso(repositorio, hasher, auditoria);

    const usuario = await caso.executar({ email: 'bia@a.com', senha: 'certa' });

    expect(usuario.id).toBe(7);
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'sessao.iniciada',
        ator: expect.objectContaining({ user_id: 7 }),
      }),
    );
  });

  it('deve lançar 401 genérico quando o e-mail não existe', async () => {
    const repositorio: IUsuarioRepositorio = {
      buscarPorEmail: vi.fn().mockResolvedValue(null),
      buscarPorId: vi.fn(),
      criar: vi.fn(),
    };
    const hasher: IHasher = { gerarHash: vi.fn(), comparar: vi.fn() };
    const auditoria: IAuditoriaRepositorio = { registrar: vi.fn().mockResolvedValue(undefined) };
    const caso = new AutenticarUsuarioCasoDeUso(repositorio, hasher, auditoria);

    await expect(caso.executar({ email: 'x@a.com', senha: 'q' })).rejects.toBeInstanceOf(
      ErroNaoAutorizado,
    );
    expect(hasher.comparar).not.toHaveBeenCalled();
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'sessao.falhou' }),
    );
  });

  it('deve lançar 401 quando a senha está incorreta', async () => {
    const repositorio: IUsuarioRepositorio = {
      buscarPorEmail: vi.fn().mockResolvedValue(usuarioFake()),
      buscarPorId: vi.fn(),
      criar: vi.fn(),
    };
    const hasher: IHasher = { gerarHash: vi.fn(), comparar: vi.fn().mockResolvedValue(false) };
    const auditoria: IAuditoriaRepositorio = { registrar: vi.fn().mockResolvedValue(undefined) };
    const caso = new AutenticarUsuarioCasoDeUso(repositorio, hasher, auditoria);

    await expect(caso.executar({ email: 'bia@a.com', senha: 'errada' })).rejects.toBeInstanceOf(
      ErroNaoAutorizado,
    );
  });
});
