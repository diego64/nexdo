// Erros de domínio tipados. Cada um carrega `codigo` (envelope) e `status` (HTTP),
// mapeados no tratador global de erros (CLAUDE.md §5 / arquitetura.md).

export class ErroDeDominio extends Error {
  readonly codigo: string;
  readonly status: number;
  readonly detalhes?: unknown;

  constructor(mensagem: string, codigo = 'dominio', status = 400, detalhes?: unknown) {
    super(mensagem);
    this.name = new.target.name;
    this.codigo = codigo;
    this.status = status;
    this.detalhes = detalhes;
  }
}

/** 400 — regra de negócio/validação de domínio violada. */
export class ErroDeValidacao extends ErroDeDominio {
  constructor(mensagem: string, detalhes?: unknown) {
    super(mensagem, 'validacao', 400, detalhes);
  }
}

/** 401 — não autenticado / credenciais inválidas. */
export class ErroNaoAutorizado extends ErroDeDominio {
  constructor(mensagem = 'Não autorizado') {
    super(mensagem, 'nao_autorizado', 401);
  }
}

/** 403 — autenticado, porém sem permissão. */
export class ErroProibido extends ErroDeDominio {
  constructor(mensagem = 'Acesso negado') {
    super(mensagem, 'proibido', 403);
  }
}

/** 404 — recurso inexistente. */
export class ErroNaoEncontrado extends ErroDeDominio {
  constructor(mensagem = 'Recurso não encontrado') {
    super(mensagem, 'nao_encontrado', 404);
  }
}

/** 409 — conflito (ex.: e-mail duplicado). */
export class ErroDeConflito extends ErroDeDominio {
  constructor(mensagem: string) {
    super(mensagem, 'conflito', 409);
  }
}
