import { describe, it, expect, vi } from 'vitest';
import { EditarTarefaCasoDeUso } from '../../src/aplicacao/casos-de-uso/tarefas/editar-tarefa.caso-de-uso.js';
import { ListarHistoricoTarefaCasoDeUso } from '../../src/aplicacao/casos-de-uso/historico/listar-historico-tarefa.caso-de-uso.js';
import { Tarefa } from '../../src/dominio/entidades/tarefa.entidade.js';
import { PapelUsuario } from '../../src/dominio/enums/papel-usuario.js';
import { StatusTarefa } from '../../src/dominio/enums/status-tarefa.js';
import { PrioridadeTarefa } from '../../src/dominio/enums/prioridade-tarefa.js';
import { ErroNaoEncontrado, ErroProibido } from '../../src/dominio/erros/erros-de-dominio.js';
import type { ITarefaRepositorio } from '../../src/dominio/repositorios/tarefa.repositorio.js';
import type { IMembroTimeRepositorio } from '../../src/dominio/repositorios/membro-time.repositorio.js';
import type { IHistoricoTarefaRepositorio } from '../../src/dominio/repositorios/historico-tarefa.repositorio.js';

const admin = { id: 1, papel: PapelUsuario.Admin };
const membro = { id: 2, papel: PapelUsuario.Membro };

function tarefaFake(status = StatusTarefa.Pendente): Tarefa {
  return new Tarefa({
    id: 100,
    title: 'T',
    description: null,
    status,
    priority: PrioridadeTarefa.Media,
    assignedTo: 2,
    teamId: 1,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  });
}

describe('Editar tarefa: transição de status → histórico', () => {
  it('passa a transição ao repositório e audita status-alterado quando o status muda', async () => {
    const editar = vi.fn().mockResolvedValue(tarefaFake(StatusTarefa.EmProgresso));
    const tarefas = {
      buscarPorId: vi.fn().mockResolvedValue(tarefaFake(StatusTarefa.Pendente)),
      editar,
    } as unknown as ITarefaRepositorio;
    const registrar = vi.fn().mockResolvedValue(undefined);
    const caso = new EditarTarefaCasoDeUso(tarefas, { registrar });

    await caso.executar({
      id: 100,
      dados: { status: StatusTarefa.EmProgresso },
      solicitante: admin,
    });

    expect(editar).toHaveBeenCalledWith(
      100,
      expect.objectContaining({ status: StatusTarefa.EmProgresso }),
      { changedBy: 1, oldStatus: StatusTarefa.Pendente, newStatus: StatusTarefa.EmProgresso },
    );
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'tarefa.status-alterado' }),
    );
  });

  it('NÃO passa transição nem audita status quando o status não muda', async () => {
    const editar = vi.fn().mockResolvedValue(tarefaFake(StatusTarefa.Pendente));
    const tarefas = {
      buscarPorId: vi.fn().mockResolvedValue(tarefaFake(StatusTarefa.Pendente)),
      editar,
    } as unknown as ITarefaRepositorio;
    const registrar = vi.fn().mockResolvedValue(undefined);
    const caso = new EditarTarefaCasoDeUso(tarefas, { registrar });

    await caso.executar({ id: 100, dados: { title: 'Só título' }, solicitante: admin });

    expect(editar).toHaveBeenCalledWith(100, expect.any(Object), undefined);
    expect(registrar).not.toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'tarefa.status-alterado' }),
    );
  });
});

describe('Listar histórico da tarefa', () => {
  const historicoRepo = {
    listarPorTarefa: vi.fn().mockResolvedValue([]),
  } as unknown as IHistoricoTarefaRepositorio;

  it('member do time → retorna histórico', async () => {
    const tarefas = { buscarPorId: vi.fn().mockResolvedValue(tarefaFake()) } as unknown as ITarefaRepositorio;
    const membros = { pertence: vi.fn().mockResolvedValue(true) } as unknown as IMembroTimeRepositorio;
    const caso = new ListarHistoricoTarefaCasoDeUso(tarefas, membros, historicoRepo);

    await expect(caso.executar({ taskId: 100, solicitante: membro })).resolves.toEqual([]);
  });

  it('member fora do time → 403', async () => {
    const tarefas = { buscarPorId: vi.fn().mockResolvedValue(tarefaFake()) } as unknown as ITarefaRepositorio;
    const membros = { pertence: vi.fn().mockResolvedValue(false) } as unknown as IMembroTimeRepositorio;
    const caso = new ListarHistoricoTarefaCasoDeUso(tarefas, membros, historicoRepo);

    await expect(caso.executar({ taskId: 100, solicitante: membro })).rejects.toBeInstanceOf(
      ErroProibido,
    );
  });

  it('tarefa inexistente → 404', async () => {
    const tarefas = { buscarPorId: vi.fn().mockResolvedValue(null) } as unknown as ITarefaRepositorio;
    const membros = { pertence: vi.fn() } as unknown as IMembroTimeRepositorio;
    const caso = new ListarHistoricoTarefaCasoDeUso(tarefas, membros, historicoRepo);

    await expect(caso.executar({ taskId: 999, solicitante: admin })).rejects.toBeInstanceOf(
      ErroNaoEncontrado,
    );
  });
});
