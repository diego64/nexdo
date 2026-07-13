/** Porta de hashing de senha — implementada com bcrypt na infraestrutura. */
export interface IHasher {
  gerarHash(texto: string): Promise<string>;
  comparar(texto: string, hash: string): Promise<boolean>;
}
