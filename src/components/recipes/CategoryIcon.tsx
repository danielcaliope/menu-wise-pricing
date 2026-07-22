import { ChefHat, Coffee, IceCream, Salad, Pizza, Cake, Wine, UtensilsCrossed, Cookie, Soup, Fish, Beef, Tag, LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  ChefHat,
  Coffee,
  IceCream,
  Salad,
  Pizza,
  Cake,
  Wine,
  UtensilsCrossed,
  Cookie,
  Soup,
  Fish,
  Beef,
  Tag,
};

export function CategoryIcon({ iconName, className }: { iconName: string | null; className?: string }) {
  const Icon = iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : Tag;
  return <Icon className={className} />;
}
