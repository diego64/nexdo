## Descrição

<!-- O que este PR faz e por quê. Referencie a SPEC correspondente (ex.: SPEC 05). -->

**SPEC relacionada:** `.specs/`

## Tipo de mudança

- [ ] Nova funcionalidade (`feat`)
- [ ] Correção de bug (`fix`)
- [ ] Refatoração (`refactor`)
- [ ] Testes (`test`)
- [ ] Infraestrutura/CI (`ci` / `build` / `chore`)
- [ ] Documentação (`docs`)

## Checklist

- [ ] Cenários BDD (Dado/Quando/Então) da SPEC estão cobertos por testes
- [ ] `pnpm lint && pnpm typecheck && pnpm test` passando localmente
- [ ] Cobertura ≥ 80% em `src/aplicacao` e `src/dominio`
- [ ] Nomenclatura PT-BR no código; banco em inglês
- [ ] Sem lógica de negócio em controlador/repositório; Zod só na borda HTTP
- [ ] Nenhum segredo, credencial ou `.env` commitado
- [ ] `.specs/memoria/progresso.md` atualizado (se conclui SPEC)
- [ ] Decisões novas registradas em `.specs/memoria/decisoes.md`

## Como testar

<!-- Passos para validar a mudança localmente. -->

## Observações

<!-- Contexto adicional, trade-offs, débitos assumidos. -->
