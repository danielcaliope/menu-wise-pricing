# Guia para criar uma feature nova

Checklist prático juntando os padrões já estabelecidos no projeto. Para o
detalhe do padrão de acesso a dados, veja [src/features/README.md](../src/features/README.md) —
este guia não repete aquele conteúdo, só aponta quando usar cada peça.

## 1. Regra de negócio nova ou cálculo → `src/domain/`

Se a feature envolve calcular algo (custo, preço, margem, conversão de
unidade), a função vai em `src/domain/<área>/` como função pura: sem import de
React, Supabase ou `toast`. Escreva o teste (`*.test.ts`) cobrindo os cenários
antes de conectar à UI — é o padrão de todo `domain/pricing` hoje.

**Não invente fórmula nova silenciosamente.** Se a conta já existe solta em
algum componente, extraia-a preservando o comportamento (documente no
comentário do arquivo de onde veio). Se é uma fórmula nova que o app ainda não
tinha, documente isso também — ver o padrão de comentário em cada arquivo de
`src/domain/pricing/*.ts` ("Reaproveitada de..." vs. "NOVA:...").

## 2. Acesso a dado do Supabase → `src/features/<domínio>/api/`

Um hook por operação (query de lista, query de item único, uma mutation por
verbo), query keys centralizadas, `requireUser()` para mutations que inserem
dado novo. Passo a passo completo em `src/features/README.md#como-adicionar-uma-feature-nova`.

Não crie hook para uma operação que a tela ainda não precisa (ex.: não crie
`useDeleteX` se nada deleta essa entidade ainda) — adicione quando o caso de
uso real aparecer.

## 3. Toda query precisa checar `error`

```ts
const { data, error } = await supabase.from("...").select("...");
if (error) throw error;
```

React Query propaga o `throw` como estado de erro da query — sem isso, uma
falha de rede/RLS vira silenciosamente "sem dado" na tela, sem nenhum aviso
(foi um achado corrigido na Etapa 9 em `DashboardAdvancedAnalytics.tsx` e
`useDashboardActiveInsights.ts`).

## 4. Formulário novo → zod + validação de número no cliente

Use um schema em `src/schemas/` (`ingredientSchema`/`recipeSchema` são o
modelo) com `try { schema.parse(form) } catch`. Para campos numéricos que
representam quantidade/valor monetário, valide `> 0` antes de enviar — não
confie só nos atributos HTML `min`/`type="number"` do input.

## 5. Acessibilidade básica

- Todo `<Label>` com `htmlFor` apontando pro `id` do input/select associado.
- Botão só com ícone (`size="icon"`) leva `aria-label` descritivo (ex.:
  `aria-label={\`Remover ${nome}\`}`, não `aria-label="Remover"` genérico
  quando há mais de um item na lista).
- Tooltip informativo (`ℹ️`) usa `<button type="button">` como
  `TooltipTrigger`, nunca `<span>` puro — senão some do teclado (Radix só
  gerencia foco de elemento nativamente focável).

## 6. Moeda e custo unitário

Use os helpers de `src/lib/currency.ts` (`formatUnitCost`) para custo unitário
de ingrediente — ele pode ser sub-centavo (custo por grama), e `.toFixed(2)`
mostraria "R$ 0.00" escondendo o valor real. Para os demais valores monetários
(preço final, custo total de receita), o padrão do app é `` `R$ ${value.toFixed(2)}` ``.

## 7. Responsividade

Layout de formulário em linha (`flex`) empilha em mobile por padrão:
`flex flex-col gap-4 sm:flex-row` (não `flex gap-4` sozinho). Grid de 2+
colunas: `grid grid-cols-1 sm:grid-cols-2` (não `grid-cols-2` fixo).

## 8. Antes de terminar

```sh
npm run lint
npm run test
npm run build
```

Se a feature mexe em ingredientes/receitas/dashboard, rode `npm run dev` e
teste o fluxo manualmente (criar, editar, excluir) — os testes hoje só cobrem
`src/domain/`, não hooks nem componentes (ver `docs/TESTES.md`).
