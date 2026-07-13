export interface EventoDeAuditoria {
  /** Ex.: 'usuario.criado', 'sessao.iniciada', 'sessao.falhou'. */
  tipo: string;
  /** Id do usuário que originou o evento, quando houver. */
  ator?: number | null;
  entidade?: string;
  entidadeId?: number | null;
  dados?: Record<string, unknown>;
}

export interface IAuditoriaRepositorio {
  /**
   * Registra um evento de auditoria. Fire-and-forget: a implementação NUNCA
   * propaga erro (falha vira log de warning) — não pode bloquear o fluxo.
   */
  registrar(evento: EventoDeAuditoria): Promise<void>;
}
