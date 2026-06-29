/**
 * Resolve a shopping-list item to its category, default unit and default
 * quantity by matching its product name against the local catalog.
 *
 * The backend doesn't store a category on ShoppingListItem rows, so the UI
 * infers it client-side from the same seed the AddItemDialog uses. This is
 * what powers:
 *  - The category icon + colored chip on every shopping row (RF-INV-012)
 *  - The auto-fill of unit + quantity when the user picks a suggestion in
 *    the Quick Add popover (RF-INV-011)
 *
 * Matching is case-insensitive and prefers exact matches over partial ones
 * ("leche entera" beats "leche"). If nothing matches, returns null so the
 * caller can fall back to a generic "Otros" rendering.
 */

import { LOCAL_PRODUCTS, type LocalProduct } from "./local-products";

export interface ResolvedProduct {
  name: string;
  category: string;
  unit: string;
  /** Sensible default quantity when this product is added for the first
   *  time. Most "kg"/"lt" items default to 1; pre-packaged "units" items
   *  default to 1 too. Kept here as a single source of truth. */
  defaultQuantity: number;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function lookupProduct(rawName: string): ResolvedProduct | null {
  const name = rawName.trim();
  if (!name) return null;
  const target = normalize(name);

  // 1) Exact match wins
  const exact = LOCAL_PRODUCTS.find((p) => normalize(p.name) === target);
  if (exact) return toResolved(exact);

  // 2) The input contains a known product name (e.g. "leche entera 1lt")
  const contained = LOCAL_PRODUCTS.find((p) => target.includes(normalize(p.name)));
  if (contained) return toResolved(contained);

  // 3) A known product name contains the input (e.g. user typed "bistec"
  //    and we have "Bistec de Res")
  const contains = LOCAL_PRODUCTS.find((p) => normalize(p.name).includes(target));
  if (contains) return toResolved(contains);

  return null;
}

function toResolved(p: LocalProduct): ResolvedProduct {
  return {
    name: p.name,
    category: p.category,
    unit: p.unit,
    defaultQuantity: 1,
  };
}

/** Rank catalog products against a free-text query for the autocomplete
 *  popover. Returns up to `limit` matches, best first. */
export function suggestProducts(query: string, limit = 6): ResolvedProduct[] {
  const q = normalize(query);
  if (!q) return [];

  const scored: Array<{ product: LocalProduct; score: number }> = [];
  for (const p of LOCAL_PRODUCTS) {
    const np = normalize(p.name);
    let score = 0;
    if (np === q) score = 100;
    else if (np.startsWith(q)) score = 80;
    else if (np.includes(q)) score = 60;
    // Token overlap (e.g. "leche" matches "Leche Entera" on the first token)
    const qTokens = q.split(/\s+/);
    const pTokens = np.split(/\s+/);
    const overlap = qTokens.filter((t) => pTokens.includes(t)).length;
    if (overlap > 0) score = Math.max(score, overlap * 20);
    if (score > 0) scored.push({ product: p, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => toResolved(s.product));
}
