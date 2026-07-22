import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryIcon } from "@/components/recipes/CategoryIcon";

export type RecipeDetailsFormState = {
  name: string;
  waste_percentage: string;
  prep_time_minutes: string;
  notes: string;
  category_id: string;
  default_servings: string;
};

type Category = { id: string; name: string; icon: string | null };

type RecipeDetailsFormProps = {
  formData: RecipeDetailsFormState;
  onChange: (formData: RecipeDetailsFormState) => void;
  categories: Category[];
};

export function RecipeDetailsForm({ formData, onChange, categories }: RecipeDetailsFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Prato/Bebida</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          placeholder="Ex: Pizza Margherita"
          maxLength={200}
          autoComplete="off"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="waste">% Desperdício</Label>
          <Input
            id="waste"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.waste_percentage}
            onChange={(e) => onChange({ ...formData, waste_percentage: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prep">Tempo de Preparo (min)</Label>
          <Input
            id="prep"
            type="number"
            min="0"
            max="10000"
            value={formData.prep_time_minutes}
            onChange={(e) => onChange({ ...formData, prep_time_minutes: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="servings">Porções Padrão</Label>
          <Input
            id="servings"
            type="number"
            min="1"
            value={formData.default_servings}
            onChange={(e) => onChange({ ...formData, default_servings: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Categoria (opcional)</Label>
        <Select
          value={formData.category_id || undefined}
          onValueChange={(value) => onChange({ ...formData, category_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sem categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <CategoryIcon iconName={cat.icon} className="h-4 w-4" />
                  <span>{cat.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => onChange({ ...formData, notes: e.target.value })}
          placeholder="Instruções especiais ou observações..."
          maxLength={1000}
          rows={3}
        />
      </div>
    </div>
  );
}
