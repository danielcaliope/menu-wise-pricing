import { useEffect, useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { ingredientSchema, type Ingredient } from "@/schemas/ingredient";
import { useIngredients } from "@/hooks/useIngredients";
import { useIngredientMinStock, useSetIngredientMinStock } from "@/hooks/useIngredientStock";
import { calculateIngredientUnitCost } from "@/domain/ingredients";
import { previewBaseUnitCost, type MeasurementUnit } from "@/domain/units";

type IngredientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingIngredient: Ingredient | null;
};

const UNIT_OPTIONS: { value: MeasurementUnit; label: string }[] = [
  { value: "g", label: "Gramas (g)" },
  { value: "kg", label: "Quilos (kg)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "l", label: "Litros (l)" },
  { value: "un", label: "Unidade (un)" },
  { value: "dz", label: "Dúzia (dz)" },
];

type FormState = {
  name: string;
  unit: string;
  supplier: string;
  unit_cost: string; // usado só no modo legado
  package_quantity: string;
  package_price: string;
  waste_percentage: string;
  min_stock: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  unit: "g",
  supplier: "",
  unit_cost: "",
  package_quantity: "",
  package_price: "",
  waste_percentage: "",
  min_stock: "",
};

export function IngredientFormDialog({ open, onOpenChange, editingIngredient }: IngredientFormDialogProps) {
  const { createIngredient, updateIngredient } = useIngredients();
  const { data: existingMinStock } = useIngredientMinStock(editingIngredient?.id ?? null);
  const setMinStock = useSetIngredientMinStock();

  const isEditing = !!editingIngredient;
  const isLegacyIngredient = isEditing && editingIngredient?.package_quantity == null;

  const [smartMode, setSmartMode] = useState(!isLegacyIngredient);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;

    if (editingIngredient) {
      setForm({
        name: editingIngredient.name,
        unit: editingIngredient.unit,
        supplier: editingIngredient.supplier || "",
        unit_cost: editingIngredient.unit_cost.toString(),
        package_quantity: editingIngredient.package_quantity?.toString() || "",
        package_price: editingIngredient.package_price?.toString() || "",
        waste_percentage: editingIngredient.waste_percentage?.toString() || "",
        min_stock: "",
      });
      setSmartMode(editingIngredient.package_quantity != null);
    } else {
      setForm(EMPTY_FORM);
      setSmartMode(true);
    }
  }, [open, editingIngredient]);

  useEffect(() => {
    if (existingMinStock != null) {
      setForm((prev) => ({ ...prev, min_stock: existingMinStock.toString() }));
    }
  }, [existingMinStock]);

  const packageQuantity = parseFloat(form.package_quantity);
  const packagePrice = parseFloat(form.package_price);
  const wastePercentage = parseFloat(form.waste_percentage) || 0;
  const hasValidSmartInputs = !isNaN(packageQuantity) && packageQuantity > 0 && !isNaN(packagePrice) && packagePrice >= 0;

  const smartPreview = hasValidSmartInputs
    ? calculateIngredientUnitCost({ packageQuantity, packagePrice, wastePercentage })
    : null;
  const baseUnitPreview = smartPreview
    ? previewBaseUnitCost(form.unit as MeasurementUnit, smartPreview.unitCost)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const supplier = form.supplier.trim() || undefined;

      let unitCostForValidation: number;
      if (smartMode) {
        if (!hasValidSmartInputs) {
          toast({
            title: "Erro de validação",
            description: "Informe quantidade e preço da embalagem corretamente",
            variant: "destructive",
          });
          return;
        }
        unitCostForValidation = calculateIngredientUnitCost({ packageQuantity, packagePrice, wastePercentage }).unitCost;
      } else {
        const cost = parseFloat(form.unit_cost);
        if (isNaN(cost) || cost < 0) {
          toast({
            title: "Erro de validação",
            description: "Custo unitário deve ser um número válido e positivo",
            variant: "destructive",
          });
          return;
        }
        unitCostForValidation = cost;
      }

      const validated = ingredientSchema.parse({
        name: form.name.trim(),
        unit: form.unit,
        unit_cost: unitCostForValidation,
        supplier,
        package_quantity: smartMode ? packageQuantity : null,
        package_price: smartMode ? packagePrice : null,
        waste_percentage: smartMode ? wastePercentage : 0,
        min_stock: form.min_stock ? parseFloat(form.min_stock) : null,
      });

      const payload = {
        name: validated.name,
        unit: validated.unit,
        supplier: validated.supplier || null,
        unitCost: validated.unit_cost,
        packageQuantity: validated.package_quantity,
        packagePrice: validated.package_price,
        wastePercentage: validated.waste_percentage,
      };

      let ingredientId: string;
      if (editingIngredient) {
        ingredientId = editingIngredient.id;
        await updateIngredient.mutateAsync({ id: editingIngredient.id, payload });
        toast({ title: "Ingrediente atualizado com sucesso!" });
      } else {
        ingredientId = await createIngredient.mutateAsync(payload);
        toast({ title: "Ingrediente cadastrado com sucesso!" });
      }

      if (validated.min_stock != null) {
        await setMinStock.mutateAsync({ ingredientId, minStock: validated.min_stock });
      }

      onOpenChange(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao salvar",
          description: String(error),
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Ingrediente" : "Novo Ingrediente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Qual é o ingrediente?
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 text-muted-foreground cursor-help">ℹ️</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Nome do ingrediente (ex: Farinha de Trigo)</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={100}
              autoComplete="off"
              required
            />
          </div>

          {isLegacyIngredient && !smartMode && (
            <Button type="button" variant="link" className="px-0 h-auto" onClick={() => setSmartMode(true)}>
              Usar calculadora automática (embalagem + perda)
            </Button>
          )}

          {smartMode ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="package_quantity">Quanto veio na embalagem?</Label>
                  <Input
                    id="package_quantity"
                    type="number"
                    step="0.001"
                    min="0"
                    value={form.package_quantity}
                    onChange={(e) => setForm({ ...form, package_quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Qual é a unidade?</Label>
                  <Select value={form.unit} onValueChange={(value) => setForm({ ...form, unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="package_price">Quanto foi pago (R$)?</Label>
                <Input
                  id="package_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.package_price}
                  onChange={(e) => setForm({ ...form, package_price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="waste_percentage">
                  Existe perda ou rendimento (%)?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-1 text-muted-foreground cursor-help">ℹ️</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Perda na compra/preparo deste ingrediente (ex: casca, aparas). Diferente da perda da receita.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="waste_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="99.99"
                  placeholder="0"
                  value={form.waste_percentage}
                  onChange={(e) => setForm({ ...form, waste_percentage: e.target.value })}
                />
              </div>

              {smartPreview && (
                <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantidade utilizável:</span>
                    <span className="font-medium">{smartPreview.usableQuantity.toFixed(3)} {form.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo por {form.unit}:</span>
                    <span className="font-medium">R$ {smartPreview.unitCost.toFixed(4)}</span>
                  </div>
                  {baseUnitPreview && baseUnitPreview.baseUnit !== form.unit && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custo por {baseUnitPreview.baseUnit}:</span>
                      <span className="font-medium">R$ {baseUnitPreview.baseUnitCost.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Select value={form.unit} onValueChange={(value) => setForm({ ...form, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Custo Unitário (R$)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999.99"
                  value={form.unit_cost}
                  onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="min_stock">Qual é o estoque mínimo? (opcional)</Label>
            <Input
              id="min_stock"
              type="number"
              step="0.001"
              min="0"
              placeholder="Deixe em branco se não quiser acompanhar estoque"
              value={form.min_stock}
              onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Fornecedor (opcional)</Label>
            <Input
              id="supplier"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              maxLength={100}
              autoComplete="off"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createIngredient.isPending || updateIngredient.isPending}
          >
            {isEditing ? "Atualizar" : "Cadastrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
