import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { carregarConfig } from '../../src/compartilhado/config.js';

describe('Funcionalidade: Configuração fail-fast', () => {
  const ambienteOriginal = { ...process.env };

  beforeEach(() => {
    process.env = { ...ambienteOriginal };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it('deve falhar rápido quando DATABASE_URL não está definida', () => {
    delete process.env.DATABASE_URL;
    process.env.JWT_SECRET = 's';
    process.env.MONGODB_URI = 'm';

    expect(() => carregarConfig()).toThrowError(/DATABASE_URL/);
  });

  it('deve carregar a config quando as variáveis obrigatórias estão presentes', () => {
    process.env.JWT_SECRET = 'segredo';
    process.env.DATABASE_URL = 'postgresql://x:y@localhost:5432/nexdo';
    process.env.MONGODB_URI = 'mongodb://x:y@localhost:27017/nexdo_audit';

    const config = carregarConfig();

    expect(config.jwtSecret).toBe('segredo');
    expect(config.databaseUrl).toContain('nexdo');
  });
});
