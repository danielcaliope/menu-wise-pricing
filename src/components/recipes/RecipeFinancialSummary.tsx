import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DollarSign } from "lucide-react";
import type { RecipeFinancialSummaryData } from "@/hooks/useRecipeFinancials";

function InfoTooltip({ children }: { children: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="ml-1 text-muted-foreground cursor-help">ℹ️</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>{children}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function SummaryLine({ label, value, tooltip, emphasis }: { label: string; value: string; tooltip?: string; emphasis?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${emphasis ? "font-semibold" : "text-sm"}`}>
      <span className="flex items-center text-muted-foreground">
        {label}
        {tooltip && <InfoTooltip>{tooltip}</InfoTooltip>}
      </span>
      <span className={emphasis ? "text-lg" : "font-medium"}>{value}</span>
    </div>
  );
}

function currency(value: number): string {
  return `R$ ${value.toFixed(2)}`;
}

type RecipeFinancialSummaryProps = {
  data: RecipeFinancialSummaryData;
};

export function RecipeFinancialSummary({ data }: RecipeFinancialSummaryProps) {
  if (data.isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Calculando...</CardContent>
      </Card>
    );
  }

  if (!data.hasIngredients) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-5 w-5" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Adicione ingredientes para ver o custo e o preço sugerido desta receita.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-5 w-5" />
          Resumo Financeiro
        </CardTitle>
        <CardDescription>Atualizado automaticamente com base nos ingredientes e custos desta receita</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Ingredientes</p>
          <div className="space-y-1">
            {data.ingredientLines.map((line) => (
              <div key={line.id} className="flex justify-between text-sm">
                <span>{line.name} ({line.quantity} {line.unit})</span>
                <span>{currency(line.lineCost)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 p-3 bg-muted rounded-lg">
          <SummaryLine label="Custo direto (ingredientes)" value={currency(data.directCost)} />
          {data.wasteCost > 0 && (
            <SummaryLine
              label="Perdas"
              value={currency(data.wasteCost)}
              tooltip="Quanto o % de desperdício da receita adiciona ao custo dos ingredientes."
            />
          )}
          {data.packagingCost > 0 && (
            <SummaryLine
              label="Custo de embalagem"
              value={currency(data.packagingCost)}
              tooltip="Custos de embalagem cadastrados especificamente para esta receita."
            />
          )}
          {data.otherIndirectCost > 0 && (
            <SummaryLine
              label="Outros custos da receita"
              value={currency(data.otherIndirectCost)}
              tooltip="Mão de obra e outros custos específicos desta receita, além da embalagem."
            />
          )}
        </div>

        <div className="space-y-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <SummaryLine
            label="Preço mínimo"
            value={currency(data.minimumPrice)}
            tooltip="Abaixo deste valor, cada venda dá prejuízo. Considera só os custos diretos desta receita — ainda não inclui uma parte dos seus custos fixos (aluguel, contas), porque isso depende de um dado que este app ainda não coleta."
          />
          <SummaryLine
            label="Preço recomendado"
            value={currency(data.recommendedPrice)}
            tooltip="Preço sugerido considerando a margem de lucro, os impostos e a região configurados em Precificação."
            emphasis
          />
          <SummaryLine
            label="Margem estimada"
            value={`${currency(data.estimatedMargin)} (${data.estimatedMarginPercentage.toFixed(1)}%)`}
            tooltip="Quanto sobra do preço recomendado depois de cobrir os custos desta receita."
          />
        </div>

        {data.hasChannelFee ? (
          <SummaryLine
            label="Preço com taxa de entrega"
            value={currency(data.priceWithDelivery ?? 0)}
            tooltip={`Preço final quando a taxa de entrega de ${data.deliveryFeePercentage}% configurada em Precificação é somada.`}
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            Nenhum canal com taxa configurado — configure em Precificação para ver o preço por canal.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
