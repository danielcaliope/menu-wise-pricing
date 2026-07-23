# Padrão de acesso ao Supabase por feature

Esta pasta centraliza o acesso ao banco por domínio de negócio, em vez de cada
página misturar consulta + transformação de dado + estado de formulário +
interface no mesmo arquivo. Adotado a partir da Etapa 8, começando por
`ingredients` e `recipes` (migração gradual — ver "Estado atual" no final).

## Estrutura

```
src/features/<dominio>/api/
  queryKeys.ts     # toda query key do domínio, num lugar só
  types.ts         # tipos de payload de escrita (quando não vêm de src/schemas)
  use<Coisa>.ts             # query de lista
  use<Coisa>Singular.ts     # query de item único por id
  useCreate<Coisa>.ts       # mutation
  useUpdate<Coisa>.ts       # mutation
  useDelete<Coisa>.ts       # mutation
  index.ts         # barrel — reexporta tudo
```

## Regras do padrão

**1. Um hook por operação.** Nunca um hook "canivete suíço" devolvendo query +
várias mutações juntas (era assim antes da Etapa 8: `useIngredients()`
devolvia `ingredients`, `createIngredient`, `updateIngredient`,
`deleteIngredient`, `importIngredients` tudo junto). Cada verbo vira seu
próprio hook. Quem consome só importa o que precisa:

```ts
// numa tela de listagem
const { ingredients, isLoading } = useIngredients();
const deleteIngredient = useDeleteIngredient();

// num formulário de criar/editar
const createIngredient = useCreateIngredient();
const updateIngredient = useUpdateIngredient();
```

**2. Query keys centralizadas em `queryKeys.ts`**, como um objeto simples de
funções — nunca string solta espalhada pelos hooks:

```ts
export const ingredientKeys = {
  all: ["ingredients"] as const,
  detail: (id: string) => ["ingredients", id] as const,
};
```

Não crie `list()`/paginação/filtros fictícios que a feature não tem hoje —
adicione quando o caso de uso real aparecer, não antes.

**3. Erro padronizado via `requireUser()`** (`src/features/shared/requireUser.ts`).
Toda mutation que precisa do usuário autenticado chama isso em vez de repetir
`supabase.auth.getUser()` + checagem de null:

```ts
const user = await requireUser(); // lança "Não autenticado" se não houver sessão
```

**4. Invalidação de cache padronizada**: toda mutation invalida via a key
factory da própria feature (`queryClient.invalidateQueries({ queryKey: ingredientKeys.all })`),
nunca uma string escrita à mão. Quando uma mutation afeta uma query de OUTRA
feature ainda não migrada (ex.: estoque mínimo de ingrediente também invalida
`["stock"]`, que é do inventário, ainda não migrado), isso fica documentado
num comentário no próprio hook — não vira uma dependência escondida.

**5. Tipos preservados, não duplicados.** Os hooks devolvem os tipos que já
existem em `src/schemas/<entidade>.ts` quando existem (ex.: `Ingredient`,
`Recipe`). Só ganham um `types.ts` próprio os payloads de escrita que não têm
schema (ex.: `IngredientWritePayload`) ou dados sem tabela dedicada de schema
(ex.: `OperatingCost`).

**6. Barrel por feature.** Quem consome importa tudo de um lugar só:

```ts
import { useIngredients, useCreateIngredient } from "@/features/ingredients/api";
```

## Como adicionar uma feature nova

1. Crie `src/features/<dominio>/api/queryKeys.ts` com a key factory.
2. Crie um hook por operação que a tela realmente precisa (não crie
   `useDelete<Coisa>` se nada ainda deleta essa entidade — adicione quando o
   caso de uso aparecer).
3. Se a mutation depende de usuário autenticado, use `requireUser()`.
4. Exporte tudo pelo `index.ts` da feature.
5. Atualize as telas que hoje fazem a query/mutation inline pra usar os hooks
   novos — troca mecânica, sem mudar comportamento.

## Estado atual (o que já migrou, o que falta)

| Feature | Status |
|---|---|
| `ingredients` | ✅ Migrado — CRUD completo + estoque mínimo |
| `recipes` | ✅ Migrado — CRUD completo + ingredientes de receita + custos indiretos por receita |
| `costs` | 🟡 Parcial — só `useOperatingCosts` (custos indiretos **globais**: aluguel, água, luz). Extraído nesta etapa porque já tinha nome pedido e dado real pronto. |
| `pricing` | ❌ Não migrado — `usePricingConfig`/`useProfile`/`useRecipeFinancials` continuam em `src/hooks/` (misturam motor de domínio, não são API pura) |
| `inventory` | ❌ Não migrado — CRUD de `ingredient_stock`/`stock_movements` continua inline em `src/pages/Stock.tsx` |
| Canal de venda (`useSalesChannels`) | ❌ Não implementado — **não existe tabela ou conceito de canal de venda no schema hoje** (só `pricing_configs.delivery_fee_percentage`, uma taxa de entrega única). Criar esse hook agora seria inventar uma abstração sobre um campo que não é isso, ou criar tabela nova sem necessidade real — nenhuma migration foi feita nesta etapa (fora de escopo). Fica documentado como pendência real, não implementado às pressas. |

Hooks que continuam em `src/hooks/` (fora do escopo desta etapa, por não
serem API pura de uma única feature): `usePricingConfig`, `useProfile`,
`useRecipeFinancials`, `useRecipesOverview`, `useOnboardingProgress`,
`useDashboardState`, `useDashboardActiveInsights`.
