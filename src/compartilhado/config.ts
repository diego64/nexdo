// Configuração da aplicação lida do ambiente, com fail-fast.
// Sem Zod aqui: Zod é restrito à borda HTTP (CLAUDE.md §2 / decisoes.md D-004).

export interface Config {
  readonly nodeEnv: string;
  readonly porta: number;
  readonly corsOrigens: string[];
  readonly jwtSecret: string;
  readonly jwtExpiracao: string;
  readonly databaseUrl: string;
  readonly mongodbUri: string;
}

class ErroDeConfiguracao extends Error {
  constructor(variavel: string) {
    super(`Variável de ambiente obrigatória ausente: ${variavel}`);
    this.name = 'ErroDeConfiguracao';
  }
}

function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (valor === undefined || valor.trim() === '') {
    throw new ErroDeConfiguracao(nome);
  }
  return valor;
}

/**
 * Carrega e valida a configuração. Falha rápido (lança) quando uma variável
 * obrigatória está ausente — chamado no bootstrap antes de qualquer I/O.
 */
export function carregarConfig(): Config {
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    porta: Number(process.env.PORTA ?? '3333'),
    corsOrigens: (process.env.CORS_ORIGENS ?? 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    jwtSecret: obrigatoria('JWT_SECRET'),
    jwtExpiracao: process.env.JWT_EXPIRACAO ?? '15m',
    databaseUrl: obrigatoria('DATABASE_URL'),
    mongodbUri: obrigatoria('MONGODB_URI'),
  };
}
