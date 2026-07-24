# Motor de precificação (`src/domain/pricing`, `src/domain/ingredients`, `src/domain/units`)

Conjunto de funções puras (sem React, sem Supabase, sem estado) que calculam
custo e preço. Cada arquivo tem só uma função, testada isoladamente em
`*.test.ts` no mesmo diretório (39 testes no total — ver `docs/TESTES.md`).
Regra do time para este módulo: **nenhuma fórmula nova é adicionada
silenciosamente** — cada função abaixo documenta no próprio arquivo se é uma
extração de uma conta que já existia numa tela, ou uma fórmula contábil nova
sem uso ainda no app.

## Custo de ingrediente

- **`calculateIngredientUnitCost`** (`domain/ingredients`) — a partir de
  quanto veio na embalagem, quanto foi pago e o % de perda/rendimento, calcula
  a quantidade utilizável e o custo por unidade (`packagePrice / usableQuantity`).
  Base do "modo inteligente" do formulário de ingredientes (Etapa 3).
- **`previewBaseUnitCost`** (`domain/units`) — só para exibição: converte o
  custo unitário para a menor unidade da mesma família (kg→g, l→ml, dz→un),
  ajuda a comparar preços entre ingredientes cadastrados em unidades diferentes.
  Nunca reescreve `unit`/`unit_cost` no banco.

## Custo de receita

- **`calculateIngredientLineCost`** — custo de uma linha (`quantity × unitCost`).
- **`calculateIngredientCost`** — soma as linhas de uma receita (sem perda% nem
  custo indireto).
- **`calculateRecipeCost`** — fórmula completa: custo dos ingredientes com
  perda% aplicada, mais a soma dos custos indiretos da receita (embalagem, mão
  de obra). `wastePercentage` negativo é tratado como 0.

## Preço de venda

- **`calculateRecommendedPrice`** — `(custo + lucro% + impostos%) × fator
  regional`, nessa ordem (lucro antes de imposto, região por último). O gate de
  plano free/paid que decide se o fator regional é aplicado é decisão de
  `useRecipeFinancials`/`Pricing.tsx`, não faz parte deste cálculo puro.
- **`calculateDeliveryInclusivePrice`** — modelo aditivo: o cliente paga a mais
  pela entrega (`price + price × taxa%`). Usado em `Pricing.tsx` para o preço
  "com entrega".
- **`calculateChannelPrice`** — modelo por desconto: quanto o negócio recebe
  líquido depois da comissão de um canal de venda (percentual e/ou fixa).
  Generalização do único caso hoje existente (`delivery_fee_percentage`); não
  confundir com `calculateDeliveryInclusivePrice` (um desconta receita, o outro
  soma ao preço do cliente).

## Métricas contábeis (prontas, ainda não conectadas à UI)

Essas três funções existem e têm teste, mas nenhuma tela hoje as chama — ver
`src/features/README.md` (`pricing` segue "❌ Não migrado") e o comentário de
cada arquivo para o motivo (falta o dado de entrada, ex. volume estimado):

- **`calculateFixedCostAllocation`** — rateio de custo fixo por unidade
  (`totalFixedCosts / estimatedVolume`); retorna 0 se `estimatedVolume <= 0`.
- **`calculateContributionMargin`** — margem de contribuição (`netRevenuePerUnit
  − variableCostPerUnit`) e o percentual correspondente.
- **`calculateBreakEvenPrice`** — preço de equilíbrio (`variableCostPerUnit +
  fixedCostPerUnit`): abaixo dele, a venda dá prejuízo.

## Risco conhecido: precisão numérica

Valores monetários são `number`/Postgres `NUMERIC` (não inteiro-centavos) — ver
a migração `20260721120000_ingredient_package_costing.sql`, que já existe
justamente porque `DECIMAL(10,2)` arredondava custo por grama/ml sub-centavo
para 0. Dentro deste módulo isso é seguro: nenhuma função arredonda valor
intermediário (`Math.round`/`toFixed` só aparecem na camada de exibição) e os
guards de divisão por zero usam `<= 0`/`> 0`, nunca comparação exata de floats
calculados. Ver o relatório da Etapa 9 para o único ponto de exibição fora
deste módulo (`Pricing.tsx`) onde essa característica gerou um bug real.
