import { describe, it, expect, vi } from 'vitest';
import { CriarTimeCasoDeUso } from '../../src/aplicacao/casos-de-uso/times/criar-time.caso-de-uso.js';
import { EditarTimeCasoDeUso } from '../../src/aplicacao/casos-de-uso/times/editar-time.caso-de-uso.js';
import { ExcluirTimeCasoDeUso } from '../../src/aplicacao/casos-de-uso/times/excluir-time.caso-de-uso.js';
import { AdicionarMembroCasoDeUso } from '../../src/aplicacao/casos-de-uso/times/adicionar-membro.caso-de-uso.js';
import { RemoverMembroCasoDeUso } from '../../src/aplicacao/casos-de-uso/times/remover-membro.caso-de-uso.js';
import { ListarMembrosCasoDeUso } from '../../src/aplicacao/casos-de-uso/times/listar-membros.caso-de-uso.js';
import { Time } from '../../src/dominio/entidades/time.entidade.js';
import { Usuario } from '../../src/dominio/entidades/usuario.entidade.js';
import { PapelUsuario } from '../../src/dominio/enums/papel-usuario.js';
import {
  ErroDeConflito,
  ErroNaoEncontrado,
  ErroProibido,
} from '../../src/dominio/erros/erros-de-dominio.js';
import type { ITimeRepositorio } from '../../src/dominio/repositorios/time.repositorio.js';
import type { IMembroTimeRepositorio } from '../../src/dominio/repositorios/membro-time.repositorio.js';
import type { IUsuarioRepositorio } from '../../src/dominio/repositorios/usuario.repositorio.js';
import type { IAuditoriaRepositorio } from '../../src/dominio/repositorios/auditoria.repositorio.js';

const admin = { id: 1, papel: PapelUsuario.Admin };
const membro = { id: 2, papel: PapelUsuario.Membro };
const auditoria: IAuditoriaRepositorio = { registrar: vi.fn().mockResolvedValue(undefined) };

function timeFake(): Time {
  return new Time({
    id: 10,
    name: 'Time A',
    description: null,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  });
}

function usuarioFake(): Usuario {
  return new Usuario({
    id: 2,
    name: 'Bia',
    email: 'bia@a.com',
    senhaHash: 'h',
    papel: PapelUsuario.Membro,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  });
}

describe('Funcionalidade: Gestão de times (casos de uso)', () => {
  it('deve criar time e registrar time.criado', async () => {
    const times = { criar: vi.fn().mockResolvedValue(timeFake()) } as unknown as ITimeRepositorio;
    const caso = new CriarTimeCasoDeUso(times, auditoria);

    const time = await caso.executar({ name: 'Time A', description: null, solicitante: admin });

    expect(time.paraResposta()).toEqual({ id: 10, name: 'Time A', description: null });
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'time.criado' }),
    );
  });

  it('deve lançar 409 ao adicionar membro já pertencente ao time', async () => {
    const times = { buscarPorId: vi.fn().mockResolvedValue(timeFake()) } as unknown as ITimeRepositorio;
    const usuarios = {
      buscarPorId: vi.fn().mockResolvedValue(usuarioFake()),
    } as unknown as IUsuarioRepositorio;
    const membros = {
      pertence: vi.fn().mockResolvedValue(true),
      adicionar: vi.fn(),
    } as unknown as IMembroTimeRepositorio;
    const caso = new AdicionarMembroCasoDeUso(times, membros, usuarios, auditoria);

    await expect(
      caso.executar({ teamId: 10, userId: 2, solicitante: admin }),
    ).rejects.toBeInstanceOf(ErroDeConflito);
    expect(membros.adicionar).not.toHaveBeenCalled();
  });

  it('deve lançar 404 ao adicionar usuário inexistente', async () => {
    const times = { buscarPorId: vi.fn().mockResolvedValue(timeFake()) } as unknown as ITimeRepositorio;
    const usuarios = { buscarPorId: vi.fn().mockResolvedValue(null) } as unknown as IUsuarioRepositorio;
    const membros = { pertence: vi.fn(), adicionar: vi.fn() } as unknown as IMembroTimeRepositorio;
    const caso = new AdicionarMembroCasoDeUso(times, membros, usuarios, auditoria);

    await expect(
      caso.executar({ teamId: 10, userId: 999, solicitante: admin }),
    ).rejects.toBeInstanceOf(ErroNaoEncontrado);
  });

  it('deve permitir member listar membros do próprio time', async () => {
    const times = { buscarPorId: vi.fn().mockResolvedValue(timeFake()) } as unknown as ITimeRepositorio;
    const membros = {
      pertence: vi.fn().mockResolvedValue(true),
      listarPorTime: vi.fn().mockResolvedValue([]),
    } as unknown as IMembroTimeRepositorio;
    const caso = new ListarMembrosCasoDeUso(times, membros);

    await expect(caso.executar({ teamId: 10, solicitante: membro })).resolves.toEqual([]);
    expect(membros.pertence).toHaveBeenCalledWith(2, 10);
  });

  it('deve lançar 403 quando member lista membros de time ao qual não pertence', async () => {
    const times = { buscarPorId: vi.fn() } as unknown as ITimeRepositorio;
    const membros = {
      pertence: vi.fn().mockResolvedValue(false),
      listarPorTime: vi.fn(),
    } as unknown as IMembroTimeRepositorio;
    const caso = new ListarMembrosCasoDeUso(times, membros);

    await expect(caso.executar({ teamId: 99, solicitante: membro })).rejects.toBeInstanceOf(
      ErroProibido,
    );
  });

  it('deve editar time e registrar time.atualizado', async () => {
    const times = { editar: vi.fn().mockResolvedValue(timeFake()) } as unknown as ITimeRepositorio;
    const caso = new EditarTimeCasoDeUso(times, auditoria);

    const time = await caso.executar({ id: 10, name: 'Novo', description: null, solicitante: admin });

    expect(time.id).toBe(10);
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'time.atualizado' }),
    );
  });

  it('deve lançar 404 ao editar time inexistente', async () => {
    const times = { editar: vi.fn().mockResolvedValue(null) } as unknown as ITimeRepositorio;
    const caso = new EditarTimeCasoDeUso(times, auditoria);

    await expect(
      caso.executar({ id: 99, name: 'X', description: null, solicitante: admin }),
    ).rejects.toBeInstanceOf(ErroNaoEncontrado);
  });

  it('deve excluir time e registrar time.removido', async () => {
    const times = { excluir: vi.fn().mockResolvedValue(true) } as unknown as ITimeRepositorio;
    const caso = new ExcluirTimeCasoDeUso(times, auditoria);

    await caso.executar({ id: 10, solicitante: admin });

    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'time.removido' }),
    );
  });

  it('deve lançar 404 ao excluir time inexistente', async () => {
    const times = { excluir: vi.fn().mockResolvedValue(false) } as unknown as ITimeRepositorio;
    const caso = new ExcluirTimeCasoDeUso(times, auditoria);

    await expect(caso.executar({ id: 99, solicitante: admin })).rejects.toBeInstanceOf(
      ErroNaoEncontrado,
    );
  });

  it('deve remover membro e registrar time.membro-removido', async () => {
    const membros = {
      remover: vi.fn().mockResolvedValue(true),
    } as unknown as IMembroTimeRepositorio;
    const caso = new RemoverMembroCasoDeUso(membros, auditoria);

    await caso.executar({ teamId: 10, userId: 2, solicitante: admin });

    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'time.membro-removido' }),
    );
  });

  it('deve lançar 404 ao remover membro inexistente', async () => {
    const membros = {
      remover: vi.fn().mockResolvedValue(false),
    } as unknown as IMembroTimeRepositorio;
    const caso = new RemoverMembroCasoDeUso(membros, auditoria);

    await expect(
      caso.executar({ teamId: 10, userId: 99, solicitante: admin }),
    ).rejects.toBeInstanceOf(ErroNaoEncontrado);
  });
});
