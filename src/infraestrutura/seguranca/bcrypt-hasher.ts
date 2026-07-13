import bcrypt from 'bcrypt';
import type { IHasher } from '../../aplicacao/portas/hasher.js';

const CUSTO = 10; // CLAUDE.md §2

export class BcryptHasher implements IHasher {
  gerarHash(texto: string): Promise<string> {
    return bcrypt.hash(texto, CUSTO);
  }

  comparar(texto: string, hash: string): Promise<boolean> {
    return bcrypt.compare(texto, hash);
  }
}
