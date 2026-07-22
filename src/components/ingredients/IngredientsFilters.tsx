import { SearchBar } from "@/components/SearchBar";

type IngredientsFiltersProps = {
  value: string;
  onChange: (value: string) => void;
};

export function IngredientsFilters({ value, onChange }: IngredientsFiltersProps) {
  return (
    <SearchBar
      value={value}
      onChange={onChange}
      placeholder="Buscar ingrediente..."
      className="w-full sm:w-72"
    />
  );
}
