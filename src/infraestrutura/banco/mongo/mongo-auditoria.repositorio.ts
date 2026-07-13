import { randomUUID } from 'node:crypto';
import type { Db } from 'mongodb';
import type {
  EventoDeAuditoria,
  IAuditoriaRepositorio,
} from '../../../dominio/repositorios/auditoria.repositorio.js';
import { obterDb } from './conexao.js';

const COLLECTION = 'audit_events';

let indicesGarantidos = false;

async function garantirIndices(db: Db): Promise<void> {
  if (indicesGarantidos) return;
  await db.collection(COLLECTION).createIndexes([
    { key: { occurred_at: -1 } },
    { key: { 'resource.type': 1, 'resource.id': 1, occurred_at: -1 } },
    { key: { event_type: 1, occurred_at: -1 } },
  ]);
  indicesGarantidos = true;
}

function paraDocumento(evento: EventoDeAuditoria): Record<string, unknown> {
  return {
    event_id: randomUUID(),
    event_type: evento.tipo,
    occurred_at: new Date(),
    actor: evento.ator ?? null,
    resource: evento.recurso ?? null,
    payload: evento.payload ?? {},
    metadata: evento.metadata ?? {},
  };
}

export class MongoAuditoriaRepositorio implements IAuditoriaRepositorio {
  async registrar(evento: EventoDeAuditoria): Promise<void> {
    // Fire-and-forget: qualquer falha vira warning, nunca propaga (CLAUDE.md §5).
    try {
      const db = await obterDb();
      await garantirIndices(db);
      await db.collection(COLLECTION).insertOne(paraDocumento(evento));
    } catch (erro) {
      console.warn(`[auditoria] falha ao registrar evento "${evento.tipo}":`, erro);
    }
  }
}
