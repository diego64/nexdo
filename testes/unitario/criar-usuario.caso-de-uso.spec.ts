import { describe, it, expect, vi } from 'vitest';
import { CriarUsuarioCasoDeUso } from '../../src/aplicacao/casos-de-uso/autenticacao/criar-usuario.caso-de-uso.js';
import { Usuario } from '../../src/dominio/entidades/usuario.entidade.js';
import { PapelUsuario } from '../../src/dominio/enums/papel-usuario.js';
import { ErroDeConflito } from '../../src/dominio/erros/erros-de-dominio.js';
import type { IUsuarioRepositorio } from '../../src/dominio/repositorios/usuario.repositorio.js';
import type { IAuditoriaRepositorio } from '../../src/dominio/repositorios/auditoria.repositorio.js';
import type { IHasher } from '../../src/aplicacao/portas/hasher.js';

function usuarioFake(over: Partial<ConstructorParameters<typeof Usuario>[0]> = {}): Usuario {
  return new Usuario({
    id: 1,
    name: 'Ana',
    email: 'ana@a.com',
    senhaHash: 'hash-armazenado',
    papel: PapelUsuario.Membro,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    ...over,
  });
}

const hasher: IHasher = {
  gerarHash: vi.fn().mockResolvedValue('hash-armazenado'),
  comparar: vi.fn(),
};
const auditoria: IAuditoriaRepositorio = { registrar: vi.fn().mockResolvedValue(undefined) };

describe('Funcionalidade: Cadastro de usuário', () => {
  it('deve criar usuário com role member e sem expor o password', async () => {
    const repositorio: IUsuarioRepositorio = {
      buscarPorEmail: vi.fn().mockResolvedValue(null),
      buscarPorId: vi.fn(),
      criar: vi.fn().mockResolvedValue(usuarioFake()),
    };
    const caso = new CriarUsuarioCasoDeUso(repositorio, hasher, auditoria);

    const usuario = await caso.executar({ name: 'Ana', email: 'ana@a.com', senha: 'senha1234' });

    expect(hasher.gerarHash).toHaveBeenCalledWith('senha1234');
    expect(repositorio.criar).toHaveBeenCalledWith(
      expect.objectContaining({ papel: PapelUsuario.Membro, senhaHash: 'hash-armazenado' }),
    );
    expect(usuario.paraResposta()).toEqual({
      id: 1,
      name: 'Ana',
      email: 'ana@a.com',
      role: 'member',
    });
    expect(usuario.paraResposta()).not.toHaveProperty('password');
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'usuario.criado' }),
    );
  });

  it('deve lançar ErroDeConflito (409) quando o e-mail já existe', async () => {
    const repositorio: IUsuarioRepositorio = {
      buscarPorEmail: vi.fn().mockResolvedValue(usuarioFake()),
      buscarPorId: vi.fn(),
      criar: vi.fn(),
    };
    const caso = new CriarUsuarioCasoDeUso(repositorio, hasher, auditoria);

    await expect(
      caso.executar({ name: 'Ana', email: 'ana@a.com', senha: 'senha1234' }),
    ).rejects.toBeInstanceOf(ErroDeConflito);
    expect(repositorio.criar).not.toHaveBeenCalled();
  });
});
