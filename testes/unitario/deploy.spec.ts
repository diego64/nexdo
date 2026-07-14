import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { carregarConfig } from '../../src/compartilhado/config.js';
import { deveUsarSSL } from '../../src/infraestrutura/banco/postgres/conexao.js';

const ambienteOriginal = { ...process.env };

describe('Deploy: porta e SSL', () => {
  beforeEach(() => {
    process.env = { ...ambienteOriginal };
    process.env.JWT_SECRET = 's';
    process.env.DATABASE_URL = 'postgresql://x:y@localhost:5432/nexdo';
    process.env.MONGODB_URI = 'mongodb://x:y@localhost:27017/nexdo_audit';
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it('usa PORT (Render) com precedência sobre PORTA', () => {
    process.env.PORT = '10000';
    process.env.PORTA = '3333';
    expect(carregarConfig().porta).toBe(10000);
  });

  it('cai para PORTA quando PORT ausente', () => {
    delete process.env.PORT;
    process.env.PORTA = '3333';
    expect(carregarConfig().porta).toBe(3333);
  });

  it('ativa SSL em produção', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_SSL;
    expect(deveUsarSSL()).toBe(true);
  });

  it('ativa SSL quando DATABASE_SSL=true', () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_SSL = 'true';
    expect(deveUsarSSL()).toBe(true);
  });

  it('NÃO usa SSL em ambiente local/CI (test, sem flag)', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.DATABASE_SSL;
    expect(deveUsarSSL()).toBe(false);
  });
});
