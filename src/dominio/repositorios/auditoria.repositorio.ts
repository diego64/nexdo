// Envelope conforme .specs/contratos/eventos-auditoria.md.

export interface AtorAuditoria {
  user_id: number | null;
  role?: string | null;
}

export interface RecursoAuditoria {
  type: 'task' | 'team' | 'user' | 'session';
  id: number | null;
}

export interface EventoDeAuditoria {
  /** event_type do catálogo: 'usuario.criado', 'time.criado', etc. */
  tipo: string;
  ator?: AtorAuditoria;
  recurso?: RecursoAuditoria;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface IAuditoriaRepositorio {
  /**
   * Registra um evento de auditoria. Fire-and-forget: a implementação NUNCA
   * propaga erro (falha vira log de warning) — não pode bloquear o fluxo.
   */
  registrar(evento: EventoDeAuditoria): Promise<void>;
}
