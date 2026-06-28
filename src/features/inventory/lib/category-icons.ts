/**
 * Mapea una categoría a un ícono Lucide y un par de colores de Tailwind.
 *
 * El backend no guarda imágenes de producto (Open Food Facts se quitó);
 * el frontend renderiza un ícono por categoría.
 *
 * Tailwind classes son strings completos para que el JIT compiler las
 * detecte en build time. Si agregás una categoría nueva, agregá una entrada
 * acá Y en `CATEGORIES` en `add-item-dialog.tsx` y en el `PRODUCTS` del
 * seed.
 */

import {
  Apple,
  Baby,
  Beef,
  Beaker,
  Box,
  Carrot,
  Cookie,
  Croissant,
  CupSoda,
  Drumstick,
  Droplet,
  Fish,
  Flame,
  Leaf,
  Milk,
  Package,
  PawPrint,
  Pizza,
  Popcorn,
  Salad,
  Sandwich,
  Snowflake,
  Soup,
  Sprout,
  Utensils,
  Wheat,
  type LucideIcon,
} from "lucide-react";

export interface CategoryStyle {
  icon: LucideIcon;
  /** Background color, usado en el cuadrado detrás del ícono. */
  bg: string;
  /** Color del ícono (stroke del svg). */
  fg: string;
}

/**
 * Tabla de íconos + colores para las 24 categorías de producto.
 * Colores tomados de la paleta 100/700 de Tailwind para que funcionen
 * en tema claro y oscuro (el 100 es el tinte pastel, el 700 el tono
 * legible para texto/stroke).
 *
 * Las keys están en español para coincidir con el `category` que manda
 * el backend (viniendo del seed).
 */
export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "Lácteos":              { icon: Milk,      bg: "bg-amber-100 dark:bg-amber-950/40",     fg: "text-amber-700 dark:text-amber-300" },
  "Carne":                { icon: Beef,      bg: "bg-rose-100 dark:bg-rose-950/40",       fg: "text-rose-700 dark:text-rose-300" },
  "Aves":                 { icon: Drumstick, bg: "bg-orange-100 dark:bg-orange-950/40",   fg: "text-orange-700 dark:text-orange-300" },
  "Pescado":              { icon: Fish,      bg: "bg-cyan-100 dark:bg-cyan-950/40",       fg: "text-cyan-700 dark:text-cyan-300" },
  "Verduras":             { icon: Salad,     bg: "bg-green-100 dark:bg-green-950/40",     fg: "text-green-700 dark:text-green-300" },
  "Frutas":               { icon: Apple,     bg: "bg-pink-100 dark:bg-pink-950/40",       fg: "text-pink-700 dark:text-pink-300" },
  "Granos":               { icon: Wheat,     bg: "bg-yellow-100 dark:bg-yellow-950/40",   fg: "text-yellow-700 dark:text-yellow-300" },
  "Pasta":                { icon: Pizza,     bg: "bg-orange-100 dark:bg-orange-950/40",   fg: "text-orange-700 dark:text-orange-300" },
  "Pan":                  { icon: Sandwich,  bg: "bg-amber-100 dark:bg-amber-950/40",     fg: "text-amber-800 dark:text-amber-300" },
  "Panadería":            { icon: Croissant, bg: "bg-amber-100 dark:bg-amber-950/40",     fg: "text-amber-700 dark:text-amber-300" },
  "Condimentos":          { icon: Beaker,    bg: "bg-stone-100 dark:bg-stone-800/40",     fg: "text-stone-700 dark:text-stone-300" },
  "Aceites":              { icon: Droplet,   bg: "bg-lime-100 dark:bg-lime-950/40",       fg: "text-lime-700 dark:text-lime-300" },
  "Salsas":               { icon: Droplet,   bg: "bg-orange-100 dark:bg-orange-950/40",   fg: "text-orange-700 dark:text-orange-300" },
  "Especias":             { icon: Flame,     bg: "bg-red-100 dark:bg-red-950/40",         fg: "text-red-700 dark:text-red-300" },
  "Hierbas":              { icon: Leaf,      bg: "bg-emerald-100 dark:bg-emerald-950/40", fg: "text-emerald-700 dark:text-emerald-300" },
  "Bebidas":              { icon: CupSoda,   bg: "bg-blue-100 dark:bg-blue-950/40",       fg: "text-blue-700 dark:text-blue-300" },
  "Botanas":              { icon: Popcorn,   bg: "bg-yellow-100 dark:bg-yellow-950/40",   fg: "text-yellow-800 dark:text-yellow-300" },
  "Congelados":           { icon: Snowflake, bg: "bg-sky-100 dark:bg-sky-950/40",         fg: "text-sky-700 dark:text-sky-300" },
  "Enlatados":            { icon: Package,   bg: "bg-stone-100 dark:bg-stone-800/40",     fg: "text-stone-700 dark:text-stone-300" },
  "Alternativas Lácteas": { icon: Milk,      bg: "bg-teal-100 dark:bg-teal-950/40",       fg: "text-teal-700 dark:text-teal-300" },
  "Comidas Preparadas":   { icon: Soup,      bg: "bg-orange-100 dark:bg-orange-950/40",   fg: "text-orange-700 dark:text-orange-300" },
  "Bebé":                 { icon: Baby,      bg: "bg-pink-100 dark:bg-pink-950/40",       fg: "text-pink-700 dark:text-pink-300" },
  "Mascotas":             { icon: PawPrint,  bg: "bg-purple-100 dark:bg-purple-950/40",   fg: "text-purple-700 dark:text-purple-300" },
  "Otros":                { icon: Box,       bg: "bg-zinc-100 dark:bg-zinc-800/40",       fg: "text-zinc-700 dark:text-zinc-300" },
};

/** Fallback para categorías desconocidas o faltantes. */
export const FALLBACK_STYLE: CategoryStyle = {
  icon: Utensils,
  bg: "bg-muted",
  fg: "text-muted-foreground",
};

export function getCategoryStyle(category: string | null | undefined): CategoryStyle {
  if (!category) return FALLBACK_STYLE;
  return CATEGORY_STYLES[category] ?? FALLBACK_STYLE;
}
