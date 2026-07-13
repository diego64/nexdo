import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoAuditoriaRepositorio } from '../../src/infraestrutura/banco/mongo/mongo-auditoria.repositorio.js';
import { obterDb, fecharMongo } from '../../src/infraestrutura/banco/mongo/conexao.js';
import { mongoDisponivel } from '../auxiliares/banco-teste.js';

const disponivel = await mongoDisponivel();

describe.skipIf(!disponivel)('Funcionalidade: Auditoria no Mongo', () => {
  const auditoria = new MongoAuditoriaRepositorio();

  beforeAll(async () => {
    const db = await obterDb();
    await db.collection('audit_events').deleteMany({ type: 'usuario.criado' });
  });

  afterAll(async () => {
    await fecharMongo();
  });

  it('deve gravar o evento usuario.criado na collection audit_events', async () => {
    await auditoria.registrar({ tipo: 'usuario.criado', ator: 99, entidade: 'user', entidadeId: 99 });

    const db = await obterDb();
    const doc = await db.collection('audit_events').findOne({ type: 'usuario.criado', actor: 99 });

    expect(doc).not.toBeNull();
    expect(doc?.entity).toBe('user');
    expect(doc?.recorded_at).toBeInstanceOf(Date);
  });
});
