import { describe, it, expect, vi } from 'vitest';
import { CriarTarefaCasoDeUso } from '../../src/aplicacao/casos-de-uso/tarefas/criar-tarefa.caso-de-uso.js';
import { ListarTarefasCasoDeUso } from '../../src/aplicacao/casos-de-uso/tarefas/listar-tarefas.caso-de-uso.js';
import { ObterTarefaCasoDeUso } from '../../src/aplicacao/casos-de-uso/tarefas/obter-tarefa.caso-de-uso.js';
import { EditarTarefaCasoDeUso } from '../../src/aplicacao/casos-de-uso/tarefas/editar-tarefa.caso-de-uso.js';
import { ExcluirTarefaCasoDeUso } from '../../src/aplicacao/casos-de-uso/tarefas/excluir-tarefa.caso-de-uso.js';
import { AtribuirTarefaCasoDeUso } from '../../src/aplicacao/casos-de-uso/tarefas/atribuir-tarefa.caso-de-uso.js';
import { Tarefa } from '../../src/dominio/entidades/tarefa.entidade.js';
import { PapelUsuario } from '../../src/dominio/enums/papel-usuario.js';
import { StatusTarefa } from '../../src/dominio/enums/status-tarefa.js';
import { PrioridadeTarefa } from '../../src/dominio/enums/prioridade-tarefa.js';
import {
  ErroDeValidacao,
  ErroNaoEncontrado,
  ErroProibido,
} from '../../src/dominio/erros/erros-de-dominio.js';
import type { ITarefaRepositorio } from '../../src/dominio/repositorios/tarefa.repositorio.js';
import type { IMembroTimeRepositorio } from '../../src/dominio/repositorios/membro-time.repositorio.js';
import type { IAuditoriaRepositorio } from '../../src/dominio/repositorios/auditoria.repositorio.js';

const admin = { id: 1, papel: PapelUsuario.Admin };
const membroA = { id: 2, papel: PapelUsuario.Membro };
const auditoria: IAuditoriaRepositorio = { registrar: vi.fn().mockResolvedValue(undefined) };

function tarefaFake(over: Partial<ConstructorParameters<typeof Tarefa>[0]> = {}): Tarefa {
  return new Tarefa({
    id: 100,
    title: 'T',
    description: null,
    status: StatusTarefa.Pendente,
    priority: PrioridadeTarefa.Media,
    assignedTo: 2,
    teamId: 1,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    ...over,
  });
}

const entradaBase = {
  title: 'Nova',
  description: null,
  status: StatusTarefa.Pendente,
  priority: PrioridadeTarefa.Media,
  assignedTo: null,
};

describe('Matriz de permissões: Criar tarefa', () => {
  it('member cria no próprio time → ok', async () => {
    const tarefas = { criar: vi.fn().mockResolvedValue(tarefaFake()) } as unknown as ITarefaRepositorio;
    const membros = { pertence: vi.fn().mockResolvedValue(true) } as unknown as IMembroTimeRepositorio;
    const caso = new CriarTarefaCasoDeUso(tarefas, membros, auditoria);

    const t = await caso.executar({ ...entradaBase, teamId: 1, solicitante: membroA });

    expect(t.id).toBe(100);
    expect(membros.pertence).toHaveBeenCalledWith(2, 1);
  });

  it('member cria em time alheio → 403', async () => {
    const tarefas = { criar: vi.fn() } as unknown as ITarefaRepositorio;
    const membros = { pertence: vi.fn().mockResolvedValue(false) } as unknown as IMembroTimeRepositorio;
    const caso = new CriarTarefaCasoDeUso(tarefas, membros, auditoria);

    await expect(
      caso.executar({ ...entradaBase, teamId: 2, solicitante: membroA }),
    ).rejects.toBeInstanceOf(ErroProibido);
    expect(tarefas.criar).not.toHaveBeenCalled();
  });

  it('admin cria em qualquer time → ok (sem checar pertencimento)', async () => {
    const tarefas = { criar: vi.fn().mockResolvedValue(tarefaFake()) } as unknown as ITarefaRepositorio;
    const membros = { pertence: vi.fn() } as unknown as IMembroTimeRepositorio;
    const caso = new CriarTarefaCasoDeUso(tarefas, membros, auditoria);

    await caso.executar({ ...entradaBase, teamId: 9, solicitante: admin });

    expect(membros.pertence).not.toHaveBeenCalled();
  });

  it('atribuir na criação a usuário fora do time → 400', async () => {
    const tarefas = { criar: vi.fn() } as unknown as ITarefaRepositorio;
    const membros = {
      pertence: vi.fn().mockResolvedValue(false),
    } as unknown as IMembroTimeRepositorio;
    const caso = new CriarTarefaCasoDeUso(tarefas, membros, auditoria);

    await expect(
      caso.executar({ ...entradaBase, assignedTo: 7, teamId: 1, solicitante: admin }),
    ).rejects.toBeInstanceOf(ErroDeValidacao);
  });
});

describe('Matriz de permissões: Listar tarefas', () => {
  it('admin → escopo nulo (todas)', async () => {
    const tarefas = {
      listar: vi.fn().mockResolvedValue({ dados: [], total: 0, pagina: 1 }),
    } as unknown as ITarefaRepositorio;
    const membros = { timesDoUsuario: vi.fn() } as unknown as IMembroTimeRepositorio;
    const caso = new ListarTarefasCasoDeUso(tarefas, membros);

    await caso.executar({ filtros: {}, pagina: 1, limite: 20, solicitante: admin });

    expect(tarefas.listar).toHaveBeenCalledWith({}, null, 1, 20);
    expect(membros.timesDoUsuario).not.toHaveBeenCalled();
  });

  it('member → escopo restrito aos seus times', async () => {
    const tarefas = {
      listar: vi.fn().mockResolvedValue({ dados: [], total: 0, pagina: 1 }),
    } as unknown as ITarefaRepositorio;
    const membros = {
      timesDoUsuario: vi.fn().mockResolvedValue([1, 3]),
    } as unknown as IMembroTimeRepositorio;
    const caso = new ListarTarefasCasoDeUso(tarefas, membros);

    await caso.executar({ filtros: {}, pagina: 1, limite: 20, solicitante: membroA });

    expect(tarefas.listar).toHaveBeenCalledWith({}, [1, 3], 1, 20);
  });
});

describe('Matriz de permissões: Obter tarefa', () => {
  it('member do time → ok', async () => {
    const tarefas = { buscarPorId: vi.fn().mockResolvedValue(tarefaFake()) } as unknown as ITarefaRepositorio;
    const membros = { pertence: vi.fn().mockResolvedValue(true) } as unknown as IMembroTimeRepositorio;
    const caso = new ObterTarefaCasoDeUso(tarefas, membros);

    await expect(caso.executar({ id: 100, solicitante: membroA })).resolves.toBeInstanceOf(Tarefa);
  });

  it('member fora do time → 403', async () => {
    const tarefas = { buscarPorId: vi.fn().mockResolvedValue(tarefaFake()) } as unknown as ITarefaRepositorio;
    const membros = { pertence: vi.fn().mockResolvedValue(false) } as unknown as IMembroTimeRepositorio;
    const caso = new ObterTarefaCasoDeUso(tarefas, membros);

    await expect(caso.executar({ id: 100, solicitante: membroA })).rejects.toBeInstanceOf(
      ErroProibido,
    );
  });

  it('tarefa inexistente → 404', async () => {
    const tarefas = { buscarPorId: vi.fn().mockResolvedValue(null) } as unknown as ITarefaRepositorio;
    const membros = { pertence: vi.fn() } as unknown as IMembroTimeRepositorio;
    const caso = new ObterTarefaCasoDeUso(tarefas, membros);

    await expect(caso.executar({ id: 999, solicitante: admin })).rejects.toBeInstanceOf(
      ErroNaoEncontrado,
    );
  });
});

describe('Matriz de permissões: Editar tarefa', () => {
  it('member editando tarefa de outro usuário → 403', async () => {
    const tarefas = {
      buscarPorId: vi.fn().mockResolvedValue(tarefaFake({ assignedTo: 999 })),
      editar: vi.fn(),
    } as unknown as ITarefaRepositorio;
    const caso = new EditarTarefaCasoDeUso(tarefas, auditoria);

    await expect(
      caso.executar({ id: 100, dados: { title: 'X' }, solicitante: membroA }),
    ).rejects.toBeInstanceOf(ErroProibido);
    expect(tarefas.editar).not.toHaveBeenCalled();
  });

  it('member editando a própria tarefa → ok', async () => {
    const tarefas = {
      buscarPorId: vi.fn().mockResolvedValue(tarefaFake({ assignedTo: 2 })),
      editar: vi.fn().mockResolvedValue(tarefaFake({ title: 'X' })),
    } as unknown as ITarefaRepositorio;
    const caso = new EditarTarefaCasoDeUso(tarefas, auditoria);

    const t = await caso.executar({ id: 100, dados: { title: 'X' }, solicitante: membroA });
    expect(t.title).toBe('X');
  });

  it('admin edita qualquer tarefa → ok', async () => {
    const tarefas = {
      buscarPorId: vi.fn().mockResolvedValue(tarefaFake({ assignedTo: 999 })),
      editar: vi.fn().mockResolvedValue(tarefaFake()),
    } as unknown as ITarefaRepositorio;
    const caso = new EditarTarefaCasoDeUso(tarefas, auditoria);

    await expect(
      caso.executar({ id: 100, dados: { status: StatusTarefa.Concluida }, solicitante: admin }),
    ).resolves.toBeInstanceOf(Tarefa);
  });

  it('tarefa inexistente → 404', async () => {
    const tarefas = {
      buscarPorId: vi.fn().mockResolvedValue(null),
      editar: vi.fn(),
    } as unknown as ITarefaRepositorio;
    const caso = new EditarTarefaCasoDeUso(tarefas, auditoria);

    await expect(
      caso.executar({ id: 999, dados: {}, solicitante: admin }),
    ).rejects.toBeInstanceOf(ErroNaoEncontrado);
  });
});

describe('Matriz de permissões: Excluir tarefa', () => {
  it('member → 403', async () => {
    const tarefas = { excluir: vi.fn() } as unknown as ITarefaRepositorio;
    const caso = new ExcluirTarefaCasoDeUso(tarefas, auditoria);

    await expect(caso.executar({ id: 100, solicitante: membroA })).rejects.toBeInstanceOf(
      ErroProibido,
    );
    expect(tarefas.excluir).not.toHaveBeenCalled();
  });

  it('admin → ok', async () => {
    const tarefas = { excluir: vi.fn().mockResolvedValue(true) } as unknown as ITarefaRepositorio;
    const caso = new ExcluirTarefaCasoDeUso(tarefas, auditoria);

    await caso.executar({ id: 100, solicitante: admin });
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'tarefa.removida' }),
    );
  });

  it('admin excluindo inexistente → 404', async () => {
    const tarefas = { excluir: vi.fn().mockResolvedValue(false) } as unknown as ITarefaRepositorio;
    const caso = new ExcluirTarefaCasoDeUso(tarefas, auditoria);

    await expect(caso.executar({ id: 999, solicitante: admin })).rejects.toBeInstanceOf(
      ErroNaoEncontrado,
    );
  });
});

describe('Matriz de permissões: Atribuir tarefa', () => {
  it('member → 403', async () => {
    const tarefas = { buscarPorId: vi.fn() } as unknown as ITarefaRepositorio;
    const membros = { pertence: vi.fn() } as unknown as IMembroTimeRepositorio;
    const caso = new AtribuirTarefaCasoDeUso(tarefas, membros, auditoria);

    await expect(
      caso.executar({ id: 100, userId: 2, solicitante: membroA }),
    ).rejects.toBeInstanceOf(ErroProibido);
  });

  it('admin atribui a usuário fora do time → 400', async () => {
    const tarefas = { buscarPorId: vi.fn().mockResolvedValue(tarefaFake()) } as unknown as ITarefaRepositorio;
    const membros = { pertence: vi.fn().mockResolvedValue(false) } as unknown as IMembroTimeRepositorio;
    const caso = new AtribuirTarefaCasoDeUso(tarefas, membros, auditoria);

    await expect(
      caso.executar({ id: 100, userId: 7, solicitante: admin }),
    ).rejects.toBeInstanceOf(ErroDeValidacao);
  });

  it('admin atribui a membro do time → ok', async () => {
    const tarefas = {
      buscarPorId: vi.fn().mockResolvedValue(tarefaFake()),
      atribuir: vi.fn().mockResolvedValue(tarefaFake({ assignedTo: 5 })),
    } as unknown as ITarefaRepositorio;
    const membros = { pertence: vi.fn().mockResolvedValue(true) } as unknown as IMembroTimeRepositorio;
    const caso = new AtribuirTarefaCasoDeUso(tarefas, membros, auditoria);

    const t = await caso.executar({ id: 100, userId: 5, solicitante: admin });
    expect(t.assignedTo).toBe(5);
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'tarefa.atribuida' }),
    );
  });

  it('admin atribui em tarefa inexistente → 404', async () => {
    const tarefas = { buscarPorId: vi.fn().mockResolvedValue(null) } as unknown as ITarefaRepositorio;
    const membros = { pertence: vi.fn() } as unknown as IMembroTimeRepositorio;
    const caso = new AtribuirTarefaCasoDeUso(tarefas, membros, auditoria);

    await expect(
      caso.executar({ id: 999, userId: 5, solicitante: admin }),
    ).rejects.toBeInstanceOf(ErroNaoEncontrado);
  });
});
