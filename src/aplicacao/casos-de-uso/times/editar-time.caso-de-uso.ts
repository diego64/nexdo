import type { Time } from '../../../dominio/entidades/time.entidade.js';
import type { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import { ErroNaoEncontrado } from '../../../dominio/erros/erros-de-dominio.js';
import type { ITimeRepositorio } from '../../../dominio/repositorios/time.repositorio.js';
import type { IAuditoriaRepositorio } from '../../../dominio/repositorios/auditoria.repositorio.js';

export interface EntradaEditarTime {
  id: number;
  name: string;
  description: string | null;
  solicitante: { id: number; papel: PapelUsuario };
}

export class EditarTimeCasoDeUso {
  constructor(
    private readonly repositorio: ITimeRepositorio,
    private readonly auditoria: IAuditoriaRepositorio,
  ) {}

  async executar(entrada: EntradaEditarTime): Promise<Time> {
    const time = await this.repositorio.editar(entrada.id, {
      name: entrada.name,
      description: entrada.description,
    });
    if (!time) {
      throw new ErroNaoEncontrado('Time não encontrado');
    }

    void this.auditoria.registrar({
      tipo: 'time.atualizado',
      ator: { user_id: entrada.solicitante.id, role: entrada.solicitante.papel },
      recurso: { type: 'team', id: time.id },
      payload: { id: time.id, name: time.name, description: time.description },
    });

    return time;
  }
}
