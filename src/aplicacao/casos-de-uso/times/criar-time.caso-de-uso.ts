import type { Time } from '../../../dominio/entidades/time.entidade.js';
import type { PapelUsuario } from '../../../dominio/enums/papel-usuario.js';
import type { ITimeRepositorio } from '../../../dominio/repositorios/time.repositorio.js';
import type { IAuditoriaRepositorio } from '../../../dominio/repositorios/auditoria.repositorio.js';

export interface EntradaCriarTime {
  name: string;
  description: string | null;
  solicitante: { id: number; papel: PapelUsuario };
}

export class CriarTimeCasoDeUso {
  constructor(
    private readonly repositorio: ITimeRepositorio,
    private readonly auditoria: IAuditoriaRepositorio,
  ) {}

  async executar(entrada: EntradaCriarTime): Promise<Time> {
    const time = await this.repositorio.criar({
      name: entrada.name,
      description: entrada.description,
    });

    void this.auditoria.registrar({
      tipo: 'time.criado',
      ator: { user_id: entrada.solicitante.id, role: entrada.solicitante.papel },
      recurso: { type: 'team', id: time.id },
      payload: { id: time.id, name: time.name, description: time.description },
    });

    return time;
  }
}
