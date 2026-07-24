# Arquitetura

Visão curta de como o código está organizado e como os dados fluem. Para o
padrão de acesso ao Supabase por feature (o mais importante para quem for
mexer em ingredientes/receitas/custos), veja [src/features/README.md](../src/features/README.md).

## Pastas principais

```
src/
  domain/        # regras de negócio puras — sem React, sem Supabase (ver MOTOR-DE-PRECIFICACAO.md)
    pricing/     # custo de receita, preço recomendado, margem, break-even
    ingredients/ # custo unitário de ingrediente (embalagem + perda)
    units/       # conversão de unidade (kg→g, l→ml, dz→un) para exibição
  features/      # acesso ao Supabase por domínio de negócio, um hook por operação
    ingredients/api/
    recipes/api/
    costs/api/
    shared/requireUser.ts   # guard de autenticação compartilhado
  hooks/         # hooks que não são API pura de uma feature: orquestram domain +
                 # features + estado de UI (ex.: useRecipeFinancials, useDashboardState,
                 # useOnboardingProgress) ou ainda não foram migrados para features/
  components/    # componentes de UI, organizados por área (ingredients/, recipes/,
                 # dashboard/, ui/ — biblioteca shadcn)
  pages/         # uma página por rota (ver src/App.tsx para o mapa de rotas)
  schemas/       # validação zod + tipos de entidade (Ingredient, Recipe, ...)
  integrations/  # cliente Supabase gerado (não editar manualmente)
```

## Fluxo de dados típico

Tela (`pages/`) → hook de feature (`features/<domínio>/api/useX`) → Supabase,
com `@tanstack/react-query` cuidando de cache/invalidação. Quando o resultado
precisa de cálculo (custo, preço, margem), o hook chama uma função pura de
`domain/` — a função de domínio nunca importa Supabase nem sabe que está rodando
num app React, o que permite testá-la isoladamente (ver `docs/TESTES.md`).

```
IngredientFormDialog.tsx
  → useCreateIngredient() / useIngredientMinStock()   (src/features/ingredients/api)
  → domain/ingredients/calculateIngredientUnitCost()   (preview do modo inteligente)

RecipeEditorDialog.tsx
  → useRecipeIngredients() / useRecipeIndirectCosts()  (src/features/recipes/api)
  → useRecipeFinancials()                              (src/hooks — orquestra o domain/pricing)
    → domain/pricing/calculateRecipeCost/calculateRecommendedPrice/...
```

## Autenticação e segurança

- Supabase Auth + Row Level Security (RLS) é a fronteira de segurança real:
  toda tabela de dado do usuário tem policy `auth.uid() = user_id`. As chaves
  em `.env` (`VITE_SUPABASE_PUBLISHABLE_KEY`) são a chave pública "anon" —
  seguras para expor no cliente por design, a proteção vem do RLS no banco,
  não do sigilo da chave.
- Mutations que inserem dado novo chamam `requireUser()`
  (`src/features/shared/requireUser.ts`) para obter o usuário autenticado e
  lançar erro claro se não houver sessão. Updates/deletes por `id` dependem
  só de RLS (o Postgres já garante que o usuário só afeta suas próprias linhas).
- Segredos de servidor (ex.: `SUPABASE_SERVICE_ROLE_KEY` usada pelas Edge
  Functions em `supabase/functions/`) usam `Deno.env.get(...)` em runtime,
  nunca ficam no bundle do cliente.

## Onde cada etapa deste refactor mexeu

Para contexto histórico (não é preciso ler para trabalhar no projeto hoje):
o motor de precificação (`domain/pricing`) e o fluxo de custo de ingredientes
(`domain/ingredients`, `domain/units`) foram extraídos de contas que viviam
soltas em `Pricing.tsx`/`RecipeIngredientsDialog.tsx`; o acesso ao Supabase foi
centralizado em `features/{ingredients,recipes,costs}/api`; o onboarding
(`useOnboardingProgress`) e o dashboard em 3 estados (`useDashboardState`)
foram adicionados depois. Onde uma função de domínio documenta no próprio
arquivo se é "reaproveitada" de uma tela existente ou "nova" (fórmula contábil
sem uso anterior no app) — essa distinção está preservada nos comentários de
cada arquivo em `src/domain/pricing/*.ts`, não repetida aqui.
