import { MongoClient, type Db } from 'mongodb';

let client: MongoClient | undefined;

/**
 * Client `mongodb` singleton, lazy. Usado para auditoria (fire-and-forget).
 * Só conecta na primeira chamada a `obterDb()`.
 */
export async function obterDb(): Promise<Db> {
  if (!client) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI não definida — impossível conectar ao MongoDB');
    }
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db();
}

export async function fecharMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = undefined;
  }
}
