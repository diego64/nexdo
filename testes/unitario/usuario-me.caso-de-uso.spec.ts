import { describe, it, expect, vi } from 'vitest';
import { ObterMeuPerfilCasoDeUso } from '../../src/aplicacao/casos-de-uso/usuarios/obter-meu-perfil.caso-de-uso.js';
import { CorrigirMeuPerfilCasoDeUso } from '../../src/aplicacao/casos-de-uso/usuarios/corrigir-meu-perfil.caso-de-uso.js';
import { AnonimizarMeuPerfilCasoDeUso } from '../../src/aplicacao/casos-de-uso/usuarios/anonimizar-meu-perfil.caso-de-uso.js';
import { Usuario } from '../../src/dominio/entidades/usuario.entidade.js';
import { PapelUsuario } from '../../src/dominio/enums/papel-usuario.js';
import { ErroDeConflito } from '../../src/dominio/erros/erros-de-dominio.js';
import type { IUsuarioRepositorio } from '../../src/dominio/repositorios/usuario.repositorio.js';
import type { IAuditoriaRepositorio } from '../../src/dominio/repositorios/auditoria.repositorio.js';
import type { IHasher } from '../../src/aplicacao/portas/hasher.js';

const titular = { id: 7, papel: PapelUsuario.Membro };
const auditoria: IAuditoriaRepositorio = { registrar: vi.fn().mockResolvedValue(undefined) };

function usuarioFake(over: Partial<ConstructorParameters<typeof Usuario>[0]> = {}): Usuario {
  return new Usuario({
    id: 7,
    name: 'Bia',
    email: 'bia@a.com',
    senhaHash: 'hash',
    papel: PapelUsuario.Membro,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    ...over,
  });
}

describe('LGPD: acesso aos próprios dados', () => {
  it('retorna o titular sem expor password e audita usuario.acessado', async () => {
    const repositorio = {
      buscarPorId: vi.fn().mockResolvedValue(usuarioFake()),
    } as unknown as IUsuarioRepositorio;
    const caso = new ObterMeuPerfilCasoDeUso(repositorio, auditoria);

    const usuario = await caso.executar({ solicitante: titular });

    expect(usuario.paraResposta()).not.toHaveProperty('password');
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'usuario.acessado' }),
    );
  });
});

describe('LGPD: correção do perfil', () => {
  it('atualiza name/email e audita usuario.corrigido', async () => {
    const repositorio = {
      buscarPorId: vi.fn().mockResolvedValue(usuarioFake()),
      buscarPorEmail: vi.fn().mockResolvedValue(null),
      atualizarPerfil: vi.fn().mockResolvedValue(usuarioFake({ name: 'Nova', email: 'nova@a.com' })),
    } as unknown as IUsuarioRepositorio;
    const caso = new CorrigirMeuPerfilCasoDeUso(repositorio, auditoria);

    const u = await caso.executar({ name: 'Nova', email: 'nova@a.com', solicitante: titular });

    expect(u.email).toBe('nova@a.com');
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'usuario.corrigido' }),
    );
  });

  it('lança 409 quando o novo e-mail já pertence a outro usuário', async () => {
    const outro = usuarioFake({ id: 99, email: 'ocupado@a.com' });
    const repositorio = {
      buscarPorId: vi.fn().mockResolvedValue(usuarioFake()),
      buscarPorEmail: vi.fn().mockResolvedValue(outro),
      atualizarPerfil: vi.fn(),
    } as unknown as IUsuarioRepositorio;
    const caso = new CorrigirMeuPerfilCasoDeUso(repositorio, auditoria);

    await expect(
      caso.executar({ email: 'ocupado@a.com', solicitante: titular }),
    ).rejects.toBeInstanceOf(ErroDeConflito);
    expect(repositorio.atualizarPerfil).not.toHaveBeenCalled();
  });
});

describe('LGPD: anonimização', () => {
  it('anonimiza com valores irreversíveis e audita usuario.anonimizado', async () => {
    const anonimizar = vi.fn().mockResolvedValue(true);
    const repositorio = { anonimizar } as unknown as IUsuarioRepositorio;
    const hasher: IHasher = { gerarHash: vi.fn().mockResolvedValue('hash-aleatorio'), comparar: vi.fn() };
    const registrar = vi.fn().mockResolvedValue(undefined);
    const caso = new AnonimizarMeuPerfilCasoDeUso(repositorio, hasher, { registrar });

    await caso.executar({ solicitante: titular });

    expect(anonimizar).toHaveBeenCalledWith(7, expect.objectContaining({
      name: 'Usuário anonimizado',
      email: expect.stringMatching(/^anonimizado\+.+@invalido$/),
      senhaHash: 'hash-aleatorio',
    }));
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'usuario.anonimizado' }),
    );
  });
});
