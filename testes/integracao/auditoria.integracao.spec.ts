import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoAuditoriaRepositorio } from '../../src/infraestrutura/banco/mongo/mongo-auditoria.repositorio.js';
import { obterDb, fecharMongo } from '../../src/infraestrutura/banco/mongo/conexao.js';
import { mongoDisponivel } from '../auxiliares/banco-teste.js';

const disponivel = await mongoDisponivel();

describe.skipIf(!disponivel)('Funcionalidade: Auditoria no Mongo', () => {
  const auditoria = new MongoAuditoriaRepositorio();

  beforeAll(async () => {
    const db = await obterDb();
    await db.collection('audit_events').deleteMany({ event_type: 'usuario.criado' });
  });

  afterAll(async () => {
    await fecharMongo();
  });

  it('deve gravar o evento usuario.criado na collection audit_events', async () => {
    await auditoria.registrar({
      tipo: 'usuario.criado',
      ator: { user_id: 99, role: 'member' },
      recurso: { type: 'user', id: 99 },
      payload: { email: 'z@z.com', role: 'member' },
    });

    const db = await obterDb();
    const doc = await db
      .collection('audit_events')
      .findOne({ event_type: 'usuario.criado', 'actor.user_id': 99 });

    expect(doc).not.toBeNull();
    expect(doc?.resource.type).toBe('user');
    expect(doc?.event_id).toBeTypeOf('string');
    expect(doc?.occurred_at).toBeInstanceOf(Date);
  });
});
