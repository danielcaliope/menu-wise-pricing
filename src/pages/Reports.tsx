import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { FileText, Download, TrendingUp, DollarSign, Package, ChefHat, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type ReportType = 'costs' | 'profitability' | 'stock' | 'movements';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('costs');
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["report-data", selectedReport, period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      switch (selectedReport) {
        case 'costs':
          return await fetchCostsReport(user.id, daysAgo);
        case 'profitability':
          return await fetchProfitabilityReport(user.id, daysAgo);
        case 'stock':
          return await fetchStockReport(user.id);
        case 'movements':
          return await fetchMovementsReport(user.id, daysAgo);
        default:
          return null;
      }
    }
  });

  const fetchCostsReport = async (userId: string, since: Date) => {
    const { data: ingredients } = await supabase
      .from("ingredients")
      .select("*")
      .eq("user_id", userId)
      .gte("updated_at", since.toISOString())
      .order("unit_cost", { ascending: false });

    const totalCost = ingredients?.reduce((sum, ing) => sum + Number(ing.unit_cost), 0) || 0;
    const averageCost = ingredients?.length ? totalCost / ingredients.length : 0;

    return {
      type: 'costs',
      summary: {
        totalIngredients: ingredients?.length || 0,
        totalCost,
        averageCost,
        highestCost: ingredients?.[0] || null,
      },
      details: ingredients || [],
    };
  };

  const fetchProfitabilityReport = async (userId: string, since: Date) => {
    const { data: pricings } = await supabase
      .from("pricing_history")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });

    const totalRevenue = pricings?.reduce((sum, p) => sum + Number(p.suggested_price), 0) || 0;
    const totalCost = pricings?.reduce((sum, p) => sum + Number(p.recipe_cost), 0) || 0;
    const totalProfit = totalRevenue - totalCost;
    const avgMargin = pricings?.length
      ? pricings.reduce((sum, p) => sum + Number(p.profit_margin_percentage), 0) / pricings.length
      : 0;

    return {
      type: 'profitability',
      summary: {
        totalPricings: pricings?.length || 0,
        totalRevenue,
        totalCost,
        totalProfit,
        avgMargin,
      },
      details: pricings || [],
    };
  };

  const fetchStockReport = async (userId: string) => {
    const { data: stock } = await supabase
      .from("ingredient_stock")
      .select("*, ingredients(id, name, unit, unit_cost)")
      .eq("user_id", userId)
      .order("current_quantity", { ascending: true });

    const lowStock = stock?.filter(s => s.current_quantity <= s.min_quantity) || [];
    const totalValue = stock?.reduce((sum, s) => 
      sum + (s.current_quantity * Number(s.ingredients.unit_cost)), 0
    ) || 0;

    return {
      type: 'stock',
      summary: {
        totalItems: stock?.length || 0,
        lowStockItems: lowStock.length,
        totalValue,
      },
      details: stock || [],
    };
  };

  const fetchMovementsReport = async (userId: string, since: Date) => {
    const { data: movements } = await supabase
      .from("stock_movements")
      .select("*, ingredients(id, name, unit)")
      .eq("user_id", userId)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });

    const entries = movements?.filter(m => m.movement_type === 'entrada') || [];
    const exits = movements?.filter(m => m.movement_type === 'saida') || [];

    return {
      type: 'movements',
      summary: {
        totalMovements: movements?.length || 0,
        entries: entries.length,
        exits: exits.length,
      },
      details: movements || [],
    };
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = "";
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");

    switch (reportData.type) {
      case 'costs':
        csvContent = "Nome,Unidade,Custo Unitário,Fornecedor,Atualizado Em\n";
        reportData.details.forEach((item: any) => {
          csvContent += `"${item.name}","${item.unit}",${item.unit_cost},"${item.supplier || ''}","${format(new Date(item.updated_at), 'dd/MM/yyyy HH:mm')}"\n`;
        });
        downloadCSV(csvContent, `relatorio-custos-${timestamp}.csv`);
        break;

      case 'profitability':
        csvContent = "Receita,Custo,Preço Sugerido,Margem %,Data\n";
        reportData.details.forEach((item: any) => {
          csvContent += `"${item.recipe_name}",${item.recipe_cost},${item.suggested_price},${item.profit_margin_percentage},"${format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}"\n`;
        });
        downloadCSV(csvContent, `relatorio-rentabilidade-${timestamp}.csv`);
        break;

      case 'stock':
        csvContent = "Ingrediente,Quantidade Atual,Quantidade Mínima,Unidade,Valor Total\n";
        reportData.details.forEach((item: any) => {
          const value = item.current_quantity * Number(item.ingredients.unit_cost);
          csvContent += `"${item.ingredients.name}",${item.current_quantity},${item.min_quantity},"${item.ingredients.unit}",${value.toFixed(2)}\n`;
        });
        downloadCSV(csvContent, `relatorio-estoque-${timestamp}.csv`);
        break;

      case 'movements':
        csvContent = "Ingrediente,Tipo,Quantidade,Quantidade Anterior,Quantidade Nova,Notas,Data\n";
        reportData.details.forEach((item: any) => {
          csvContent += `"${item.ingredients.name}","${item.movement_type}",${item.quantity},${item.previous_quantity},${item.new_quantity},"${item.notes || ''}","${format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}"\n`;
        });
        downloadCSV(csvContent, `relatorio-movimentacoes-${timestamp}.csv`);
        break;
    }

    toast({
      title: "Relatório exportado",
      description: "Arquivo CSV baixado com sucesso"
    });
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(["\ufeff" + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
    let worksheetData: any[] = [];
    let filename = "";

    switch (reportData.type) {
      case 'costs':
        worksheetData = [
          ["Nome", "Unidade", "Custo Unitário", "Fornecedor", "Atualizado Em"],
          ...reportData.details.map((item: any) => [
            item.name,
            item.unit,
            Number(item.unit_cost),
            item.supplier || '',
            format(new Date(item.updated_at), 'dd/MM/yyyy HH:mm')
          ])
        ];
        filename = `relatorio-custos-${timestamp}.xlsx`;
        break;

      case 'profitability':
        worksheetData = [
          ["Receita", "Custo", "Preço Sugerido", "Margem %", "Data"],
          ...reportData.details.map((item: any) => [
            item.recipe_name,
            Number(item.recipe_cost),
            Number(item.suggested_price),
            Number(item.profit_margin_percentage),
            format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')
          ])
        ];
        filename = `relatorio-rentabilidade-${timestamp}.xlsx`;
        break;

      case 'stock':
        worksheetData = [
          ["Ingrediente", "Quantidade Atual", "Quantidade Mínima", "Unidade", "Valor Total"],
          ...reportData.details.map((item: any) => [
            item.ingredients.name,
            item.current_quantity,
            item.min_quantity,
            item.ingredients.unit,
            item.current_quantity * Number(item.ingredients.unit_cost)
          ])
        ];
        filename = `relatorio-estoque-${timestamp}.xlsx`;
        break;

      case 'movements':
        worksheetData = [
          ["Ingrediente", "Tipo", "Quantidade", "Quantidade Anterior", "Quantidade Nova", "Notas", "Data"],
          ...reportData.details.map((item: any) => [
            item.ingredients.name,
            item.movement_type,
            item.quantity,
            item.previous_quantity,
            item.new_quantity,
            item.notes || '',
            format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')
          ])
        ];
        filename = `relatorio-movimentacoes-${timestamp}.xlsx`;
        break;
    }

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, filename);

    toast({
      title: "Relatório exportado",
      description: "Arquivo Excel baixado com sucesso"
    });
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const timestamp = format(new Date(), "dd/MM/yyyy HH:mm");
    
    doc.setFontSize(18);
    doc.text(currentConfig.title, 14, 20);
    doc.setFontSize(11);
    doc.text(`Gerado em: ${timestamp}`, 14, 28);
    doc.text(`Período: Últimos ${period} dias`, 14, 34);

    let tableData: any[] = [];
    let headers: string[] = [];

    switch (reportData.type) {
      case 'costs':
        headers = ["Nome", "Unidade", "Custo", "Fornecedor"];
        tableData = reportData.details.map((item: any) => [
          item.name,
          item.unit,
          `R$ ${Number(item.unit_cost).toFixed(2)}`,
          item.supplier || '-'
        ]);
        break;

      case 'profitability':
        headers = ["Receita", "Custo", "Preço", "Margem %"];
        tableData = reportData.details.map((item: any) => [
          item.recipe_name,
          `R$ ${Number(item.recipe_cost).toFixed(2)}`,
          `R$ ${Number(item.suggested_price).toFixed(2)}`,
          `${Number(item.profit_margin_percentage).toFixed(1)}%`
        ]);
        break;

      case 'stock':
        headers = ["Ingrediente", "Atual", "Mínimo", "Valor"];
        tableData = reportData.details.map((item: any) => [
          item.ingredients.name,
          `${item.current_quantity} ${item.ingredients.unit}`,
          `${item.min_quantity} ${item.ingredients.unit}`,
          `R$ ${(item.current_quantity * Number(item.ingredients.unit_cost)).toFixed(2)}`
        ]);
        break;

      case 'movements':
        headers = ["Ingrediente", "Tipo", "Qtd", "Data"];
        tableData = reportData.details.map((item: any) => [
          item.ingredients.name,
          item.movement_type,
          `${item.quantity} ${item.ingredients.unit}`,
          format(new Date(item.created_at), 'dd/MM/yy')
        ]);
        break;
    }

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    const filename = `relatorio-${reportData.type}-${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.pdf`;
    doc.save(filename);

    toast({
      title: "Relatório exportado",
      description: "Arquivo PDF baixado com sucesso"
    });
  };

  const reportConfigs = {
    costs: {
      title: "Relatório de Custos",
      description: "Análise detalhada dos custos de ingredientes",
      icon: DollarSign,
    },
    profitability: {
      title: "Relatório de Rentabilidade",
      description: "Análise de margens e lucros das receitas",
      icon: TrendingUp,
    },
    stock: {
      title: "Relatório de Estoque",
      description: "Situação atual do inventário",
      icon: Package,
    },
    movements: {
      title: "Relatório de Movimentações",
      description: "Histórico de entradas e saídas",
      icon: ChefHat,
    },
  };

  const currentConfig = reportConfigs[selectedReport];
  const Icon = currentConfig.icon;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground">
            Gere e exporte relatórios detalhados do seu negócio
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(reportConfigs).map(([key, config]) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${
                selectedReport === key ? 'ring-2 ring-primary' : 'hover:bg-accent'
              }`}
              onClick={() => setSelectedReport(key as ReportType)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {config.title.replace("Relatório de ", "")}
                </CardTitle>
                <config.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {config.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {currentConfig.title}
                </CardTitle>
                <CardDescription>{currentConfig.description}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportToCSV} disabled={isLoading || !reportData}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" onClick={exportToExcel} disabled={isLoading || !reportData}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel
                </Button>
                <Button onClick={exportToPDF} disabled={isLoading || !reportData}>
                  <FileText className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Carregando dados...</p>
              </div>
            ) : reportData ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <Card key={key}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {typeof value === 'number' 
                            ? (key.includes('Cost') || key.includes('Revenue') || key.includes('Profit') || key.includes('Value')
                                ? `R$ ${value.toFixed(2)}`
                                : key.includes('Margin') || key.includes('margin')
                                ? `${value.toFixed(1)}%`
                                : value.toLocaleString())
                            : value?.name || '-'}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Details Table */}
                <div className="border rounded-lg overflow-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        {selectedReport === 'costs' && (
                          <>
                            <th className="text-left p-3">Ingrediente</th>
                            <th className="text-left p-3">Unidade</th>
                            <th className="text-right p-3">Custo</th>
                            <th className="text-left p-3">Fornecedor</th>
                          </>
                        )}
                        {selectedReport === 'profitability' && (
                          <>
                            <th className="text-left p-3">Receita</th>
                            <th className="text-right p-3">Custo</th>
                            <th className="text-right p-3">Preço</th>
                            <th className="text-right p-3">Margem</th>
                            <th className="text-left p-3">Data</th>
                          </>
                        )}
                        {selectedReport === 'stock' && (
                          <>
                            <th className="text-left p-3">Ingrediente</th>
                            <th className="text-right p-3">Atual</th>
                            <th className="text-right p-3">Mínimo</th>
                            <th className="text-right p-3">Valor Total</th>
                          </>
                        )}
                        {selectedReport === 'movements' && (
                          <>
                            <th className="text-left p-3">Ingrediente</th>
                            <th className="text-left p-3">Tipo</th>
                            <th className="text-right p-3">Quantidade</th>
                            <th className="text-left p-3">Data</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.details.slice(0, 50).map((item: any, idx: number) => (
                        <tr key={idx} className="border-t hover:bg-muted/50">
                          {selectedReport === 'costs' && (
                            <>
                              <td className="p-3">{item.name}</td>
                              <td className="p-3">{item.unit}</td>
                              <td className="p-3 text-right">R$ {Number(item.unit_cost).toFixed(2)}</td>
                              <td className="p-3">{item.supplier || '-'}</td>
                            </>
                          )}
                          {selectedReport === 'profitability' && (
                            <>
                              <td className="p-3">{item.recipe_name}</td>
                              <td className="p-3 text-right">R$ {Number(item.recipe_cost).toFixed(2)}</td>
                              <td className="p-3 text-right">R$ {Number(item.suggested_price).toFixed(2)}</td>
                              <td className="p-3 text-right">{Number(item.profit_margin_percentage).toFixed(1)}%</td>
                              <td className="p-3">{format(new Date(item.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}</td>
                            </>
                          )}
                          {selectedReport === 'stock' && (
                            <>
                              <td className="p-3">{item.ingredients.name}</td>
                              <td className="p-3 text-right">{item.current_quantity} {item.ingredients.unit}</td>
                              <td className="p-3 text-right">{item.min_quantity} {item.ingredients.unit}</td>
                              <td className="p-3 text-right">
                                R$ {(item.current_quantity * Number(item.ingredients.unit_cost)).toFixed(2)}
                              </td>
                            </>
                          )}
                          {selectedReport === 'movements' && (
                            <>
                              <td className="p-3">{item.ingredients.name}</td>
                              <td className="p-3 capitalize">{item.movement_type}</td>
                              <td className="p-3 text-right">{item.quantity} {item.ingredients.unit}</td>
                              <td className="p-3">{format(new Date(item.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {reportData.details.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mb-4 opacity-50" />
                    <p>Nenhum dado encontrado para o período selecionado</p>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
