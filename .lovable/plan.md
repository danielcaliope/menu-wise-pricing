# Plano: Organizar o MenuWise (UX + correções básicas)

Objetivo: deixar o sistema claro e guiar o usuário na ordem certa de configuração, antes de retomar a integração iFood.

## Diagnóstico de UX (o que causa confusão hoje)

```text
PROBLEMA                              IMPACTO
─────────────────────────────────────────────────────────
Menu lateral com 12 itens "soltos"   Usuário não sabe por
em lista única, fora de ordem de     onde começar nem o que
uso (Categorias antes de Estoque)    é essencial vs. opcional

"Debug iFood" visível no menu        Página técnica de teste
para o cliente final                 exposta como se fosse
                                     funcionalidade normal

Onboarding (tour) só aparece 1x e    Quem pula o tour ou volta
fica preso no localStorage           depois fica sem orientação

Tour, SetupProgress e QuickActions   Três "guias" diferentes,
têm passos diferentes entre si       sem uma fonte única da
                                     ordem correta

Sem indicação de pré-requisitos      Ex.: Precificação exige
nas próprias páginas                 receita + ingrediente, mas
                                     a página não avisa
```

O sistema **já tem** boas bases (Onboarding, SetupProgress, QuickActions no Dashboard) — o problema é organização e consistência, não falta de recurso.

## A ordem correta de uso (fonte única da verdade)

Esta sequência passará a guiar todo o sistema (menu, tour e dashboard):

```text
ESSENCIAL (para o sistema funcionar)
  1. Ingredientes      → cadastrar insumos e custos
  2. Categorias        → (opcional, organiza receitas)
  3. Receitas/Pratos   → fichas técnicas
  4. Custos Indiretos  → rateio (aluguel, embalagem)
  5. Precificação      → preço de venda ideal
  6. Vendas            → registrar e acompanhar lucro

ACOMPANHAMENTO (depois de configurado)
  7. Controle de Estoque
  8. Alertas de Custos
  9. Análise Competitiva
 10. Relatórios
 11. Cardápio Digital

INTEGRAÇÕES (etapa avançada)
 12. iFood (config → pedidos)
```

## Mudanças propostas

### 1. Reorganizar o menu lateral por etapas
Em `src/components/AppSidebar.tsx`, dividir em grupos com rótulos claros, na ordem de uso:
- **Comece aqui** (Configuração essencial): Ingredientes, Categorias, Receitas, Custos Indiretos, Precificação
- **Operação**: Vendas, Estoque, Cardápio Digital
- **Análises**: Alertas de Custos, Análise Competitiva, Relatórios
- **Integrações**: Configuração iFood, Pedidos iFood
- Manter Dashboard no topo, fora dos grupos.

### 2. Esconder a página de Debug do cliente
Remover "Debug iFood" do menu lateral (a rota `/ifood-debug` continua existindo para uso técnico, só não aparece para o cliente).

### 3. Tornar o tour de boas-vindas reabrível
- Adicionar botão "Ver tutorial" nas Configurações (e/ou no Dashboard) que reabre o `Onboarding`.
- Alinhar os passos do tour à ordem oficial acima.

### 4. Unificar o guia de configuração (SetupProgress)
- Expandir `SetupProgress` para refletir a sequência essencial completa (incluir Custos Indiretos como passo opcional sinalizado).
- Garantir que o Dashboard sempre mostre o "próximo passo" com destaque até a configuração essencial estar completa.

### 5. Avisos de pré-requisito nas páginas
Em Receitas, Precificação e Vendas: quando faltar o pré-requisito (sem ingredientes / sem receitas / sem preços), mostrar um aviso amigável com botão de atalho para a etapa anterior, em vez de uma tela vazia confusa.

### 6. Correção pontual no Onboarding
Ajustar `handleFinish`/`handleSkip` em `src/components/Onboarding.tsx` para que ao pular/concluir o usuário sempre vá para um destino válido (Ingredientes), evitando navegar para rota indefinida no passo de boas-vindas.

## Fora de escopo (próximas etapas)
- Integração iFood (merchant_id, status de pedidos, token automático).
- Triggers reais dos Alertas de Custos.
- Fluxo de pagamento do "Fazer Upgrade".

## Detalhes técnicos
- Arquivos afetados: `AppSidebar.tsx`, `Onboarding.tsx`, `SetupProgress.tsx`, `Settings.tsx`, e os topos de `Recipes.tsx`, `Pricing.tsx`, `Sales.tsx`.
- Todas as mudanças são de frontend/apresentação — sem alteração de banco ou lógica de negócio.
- O componente `EmptyState` já existe e pode ser reutilizado para os avisos de pré-requisito.
