import { describe, it, expect, beforeAll } from 'vitest';
import { configurarValidacaoPtBr } from '../../src/infraestrutura/http/middlewares/validacao.middleware.js';
import { criarUsuarioEsquema } from '../../src/infraestrutura/http/esquemas/criar-usuario.esquema.js';
import { criarTarefaEsquema } from '../../src/infraestrutura/http/esquemas/criar-tarefa.esquema.js';
import { filtrarTarefasEsquema } from '../../src/infraestrutura/http/esquemas/filtrar-tarefas.esquema.js';
import { criarTimeEsquema } from '../../src/infraestrutura/http/esquemas/criar-time.esquema.js';

beforeAll(() => configurarValidacaoPtBr());

describe('Esquema: criar usuário', () => {
  it('aceita payload válido', () => {
    const r = criarUsuarioEsquema.safeParse({
      name: 'Ana',
      email: 'ana@a.com',
      password: 'senha1234',
    });
    expect(r.success).toBe(true);
  });

  it('rejeita e-mail malformado com issue no campo email', () => {
    const r = criarUsuarioEsquema.safeParse({ name: 'Ana', email: 'abc', password: 'senha1234' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].path).toEqual(['email']);
    }
  });

  it('rejeita password com menos de 8 caracteres', () => {
    const r = criarUsuarioEsquema.safeParse({ name: 'Ana', email: 'ana@a.com', password: '123' });
    expect(r.success).toBe(false);
  });

  it('rejeita campo extra (mass assignment)', () => {
    const r = criarUsuarioEsquema.safeParse({
      name: 'Ana',
      email: 'ana@a.com',
      password: 'senha1234',
      role: 'admin',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].code).toBe('unrecognized_keys');
    }
  });
});

describe('Esquema: criar tarefa', () => {
  it('aplica defaults de status/priority', () => {
    const r = criarTarefaEsquema.safeParse({ title: 'X', team_id: 1 });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.status).toBe('pending');
      expect(r.data.priority).toBe('medium');
    }
  });

  it('rejeita enum de status inválido listando valores válidos', () => {
    const r = criarTarefaEsquema.safeParse({ title: 'X', team_id: 1, status: 'done' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].code).toBe('invalid_enum_value');
    }
  });

  it('rejeita título vazio', () => {
    const r = criarTarefaEsquema.safeParse({ title: '', team_id: 1 });
    expect(r.success).toBe(false);
  });
});

describe('Esquema: filtrar tarefas (paginação)', () => {
  it('coage pagina/limite de string para número', () => {
    const r = filtrarTarefasEsquema.safeParse({ pagina: '2', limite: '50' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.pagina).toBe(2);
      expect(r.data.limite).toBe(50);
    }
  });

  it('rejeita limite acima de 100', () => {
    const r = filtrarTarefasEsquema.safeParse({ limite: '9999' });
    expect(r.success).toBe(false);
  });

  it('usa defaults quando ausentes', () => {
    const r = filtrarTarefasEsquema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.pagina).toBe(1);
      expect(r.data.limite).toBe(20);
    }
  });
});

describe('Esquema: criar time', () => {
  it('rejeita name acima de 100 caracteres', () => {
    const r = criarTimeEsquema.safeParse({ name: 'x'.repeat(101) });
    expect(r.success).toBe(false);
  });
});
