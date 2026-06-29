/**
 * Resolve a product category ID to a localized, human-readable label.
 *
 * The Shopping list, Inventory, and Recipe pages all show category badges
 * with a name like "Lácteos" or "Verduras". The previous version of the
 * Shopping page tried to translate via `t(\`type_${category}\`)`, which
 * only works for the *storage* types (refrigerator/freezer/pantry/other).
 * For product categories that key didn't exist, so the fallback returned
 * the literal key text — users saw ugly `type_Lácteos` strings instead of
 * the clean label.
 *
 * `formatCategory` builds the right key (`category_${slug}`) where the
 * slug replaces spaces with underscores so the multi-word category
 * "Alternativas Lácteas" still hits its translation entry.
 */

export type Translator = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export function formatCategory(category: string | null | undefined, t: Translator): string {
  if (!category) return "";
  const slug = category.replace(/\s+/g, "_");
  const translated = t(`category_${slug}` as any);
  // If the key is missing, the i18n helper returns the key string. Detect
  // that and fall back to the raw category so we never show "category_X".
  if (translated.startsWith("category_")) return category;
  return translated || category;
}
