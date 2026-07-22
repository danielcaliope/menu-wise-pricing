import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ingredientSchema } from "@/schemas/ingredient";

type ImportRow = { name: string; unit: string; unit_cost: number; supplier: string | null };

type IngredientImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: ImportRow[]) => Promise<void>;
};

function downloadTemplate() {
  const csvContent = "nome,unidade,custo_unitario,fornecedor\nFarinha de Trigo,kg,5.50,Fornecedor A\nAçúcar,kg,3.20,Fornecedor B\nOvos,dz,8.00,Fornecedor C";
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "template_ingredientes.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function IngredientImportDialog({ open, onOpenChange, onImport }: IngredientImportDialogProps) {
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        toast({
          title: "Erro",
          description: "Arquivo CSV vazio ou inválido",
          variant: "destructive",
        });
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const requiredHeaders = ["nome", "unidade", "custo_unitario"];
      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

      if (missingHeaders.length > 0) {
        toast({
          title: "Erro no formato",
          description: `Colunas obrigatórias faltando: ${missingHeaders.join(", ")}`,
          variant: "destructive",
        });
        return;
      }

      const rowsToInsert: ImportRow[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });

        try {
          const ingredient = {
            name: row.nome,
            unit: row.unidade,
            unit_cost: parseFloat(row.custo_unitario.replace(",", ".")),
            supplier: row.fornecedor || null,
          };

          ingredientSchema.parse({ ...ingredient, waste_percentage: 0 });
          rowsToInsert.push(ingredient);
        } catch (error) {
          errors.push(`Linha ${i + 1}: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
        }
      }

      if (rowsToInsert.length === 0) {
        toast({
          title: "Nenhum ingrediente válido",
          description: "Verifique o formato do arquivo",
          variant: "destructive",
        });
        return;
      }

      await onImport(rowsToInsert);

      toast({
        title: "Importação concluída!",
        description: `${rowsToInsert.length} ingrediente(s) importado(s) com sucesso${errors.length > 0 ? `. ${errors.length} linha(s) com erro.` : ""}`,
      });

      if (errors.length > 0) {
        console.warn("Erros na importação:", errors);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao importar:", error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Ingredientes via CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              <strong>1. Baixe o modelo CSV</strong> com o formato correto
            </p>
            <Button variant="outline" onClick={downloadTemplate} className="w-full gap-2">
              <Download className="h-4 w-4" />
              Baixar Modelo CSV
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              <strong>2. Preencha o arquivo</strong> com seus ingredientes
            </p>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <p className="font-medium mb-1">Colunas obrigatórias:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>nome</strong> - Nome do ingrediente</li>
                <li><strong>unidade</strong> - g, kg, ml, l, un, dz</li>
                <li><strong>custo_unitario</strong> - Valor numérico (use ponto ou vírgula)</li>
                <li><strong>fornecedor</strong> - Opcional</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              <strong>3. Faça upload</strong> do arquivo preenchido
            </p>
            <Input type="file" accept=".csv" onChange={handleFileUpload} disabled={isImporting} />
          </div>

          {isImporting && (
            <p className="text-sm text-center text-muted-foreground animate-pulse">
              Importando ingredientes...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
