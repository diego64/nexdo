# Política de Segurança — nexdo

## Versões suportadas

| Versão | Suporte |
|---|---|
| Última release (`latest`) | ✅ |
| Anteriores | ❌ |

## Como reportar uma vulnerabilidade

**Não abra issue pública.** Reporte de forma privada:

1. **Preferencial:** aba *Security* → *Report a vulnerability* (GitHub Private Vulnerability Reporting).
2. **Alternativa:** e-mail para <diegoferreira1964@gmail.com> com assunto `[SEGURANÇA] nexdo`.

Inclua: descrição, passos para reproduzir, impacto estimado e, se possível, uma prova de conceito.

## Prazos

| Etapa | Prazo |
|---|---|
| Confirmação de recebimento | até 48h |
| Avaliação inicial | até 7 dias |
| Correção (severidade alta/crítica) | até 30 dias |

## Escopo

- API nexdo (`src/`), migrations (`database/`) e pipelines (`.github/`).
- Fora de escopo: vulnerabilidades em dependências já reportadas upstream (abra PR de bump ou aguarde o Renovate), ataques que exijam acesso físico à máquina.

## Boas práticas do projeto

- Senhas com `bcrypt` (custo 10); JWT com expiração curta e segredo via variável de ambiente.
- Queries sempre parametrizadas; validação Zod `.strict()` na borda HTTP.
- Credenciais de desenvolvimento (usuário `administrador`) valem **somente** para ambiente local; os valores reais ficam no `.env` local, nunca versionados.
- Secret scanning e CodeQL ativos no repositório.
