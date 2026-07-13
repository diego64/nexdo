import type {
  EventoDeAuditoria,
  IAuditoriaRepositorio,
} from '../../../dominio/repositorios/auditoria.repositorio.js';
import { obterDb } from './conexao.js';

const COLLECTION = 'audit_events';

function paraDocumento(evento: EventoDeAuditoria): Record<string, unknown> {
  return {
    type: evento.tipo,
    actor: evento.ator ?? null,
    entity: evento.entidade ?? null,
    entity_id: evento.entidadeId ?? null,
    data: evento.dados ?? {},
    recorded_at: new Date(),
  };
}

export class MongoAuditoriaRepositorio implements IAuditoriaRepositorio {
  async registrar(evento: EventoDeAuditoria): Promise<void> {
    // Fire-and-forget: qualquer falha vira warning, nunca propaga (CLAUDE.md §5).
    try {
      const db = await obterDb();
      await db.collection(COLLECTION).insertOne(paraDocumento(evento));
    } catch (erro) {
      console.warn(`[auditoria] falha ao registrar evento "${evento.tipo}":`, erro);
    }
  }
}
