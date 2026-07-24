# Comandos de lint, teste e build

```sh
npm run lint    # ESLint em todo o projeto
npm run test    # vitest run — testes unitários
npm run build   # vite build — build de produção
npm run dev     # servidor de desenvolvimento
```

## O que hoje tem teste

Toda a lógica pura de cálculo em `src/domain/` (`pricing/`, `ingredients/`,
`units/`) tem teste unitário ao lado de cada função (`*.test.ts`), cobrindo os
cenários de cada fórmula descrita em `docs/MOTOR-DE-PRECIFICACAO.md` — 39
testes no total, todos passando.

## Gaps de cobertura conhecidos

Fora do `domain/`, não existe nenhum teste hoje (`vitest.config.ts` inclusive
só inclui `src/**/*.test.ts`, sem `.tsx` — testar componente exigiria ajustar
essa config primeiro). As áreas onde isso pesa mais, por concentrarem regra de
negócio fora do motor de precificação puro:

- **`src/hooks/useDashboardState.ts`** — decide quando o usuário sai do
  onboarding para o estado "ativo" do dashboard (regra: depois da 2ª receita
  criada, sendo 1 do onboarding + 1 sem ajuda).
- **`src/hooks/useOnboardingProgress.ts`** — define as 6 condições de "passo
  completo" do checklist de ativação.
- **`src/features/shared/requireUser.ts`** — guard de autenticação usado pelas
  mutations que inserem dado novo.
- **`src/hooks/useRecipeFinancials.ts`** — orquestra as funções de
  `domain/pricing` com regras extras (gate de plano pago para fator regional,
  decisão de pular `calculateChannelPrice`) que não são cobertas pelos testes
  do domínio, já que essas funções continuam corretas isoladamente mesmo se a
  composição em `useRecipeFinancials` estiver errada.
- **`src/hooks/useDashboardActiveInsights.ts`** — thresholds de negócio
  (margem crítica, aumento de custo) que alimentam os alertas do dashboard.

Nenhum teste foi adicionado para esses hooks nesta etapa — ver o relatório da
Etapa 9 para a priorização completa. Adicionar teste de hook/componente exige
primeiro decidir a estratégia (Testing Library + mock do Supabase, por
exemplo), o que é uma decisão maior que "limpeza final".
