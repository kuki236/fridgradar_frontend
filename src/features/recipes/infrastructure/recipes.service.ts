import { apiRequest } from "@/lib/api";

export interface RecipeIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  is_have: boolean;
  is_urgent: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  match_pct: number;
  waste_rescue_score: number;
  priority_score: number;
  have_ingredients: RecipeIngredient[];
  need_ingredients: RecipeIngredient[];
  source: "ai" | "fallback";
  max_time_minutes: number | null;
  difficulty: string | null;
  dietary: string[];
}

interface RecipeListResponse {
  recipes: Recipe[];
  source: "ai" | "fallback";
  message: string | null;
  inventory_summary: Record<string, number> | null;
  total: number;
  limit: number;
  offset: number;
}

interface CookResult {
  recipe_name: string;
  household_id: string;
  consumed: Array<{
    product_name: string;
    consumed_quantity: number;
    new_quantity: number;
    status: string;
  }>;
}

export const recipesApi = {
  suggest: (householdId: string, params?: { max_time?: number; difficulty?: string; dietary?: string[]; limit?: number; offset?: number }) => {
    const search = new URLSearchParams({ household_id: householdId });
    if (params?.max_time != null) search.set("max_time", String(params.max_time));
    if (params?.difficulty) search.set("difficulty", params.difficulty);
    if (params?.dietary) params.dietary.forEach((d) => search.append("dietary", d));
    if (params?.limit != null) search.set("limit", String(params.limit));
    if (params?.offset != null) search.set("offset", String(params.offset));
    return apiRequest<RecipeListResponse>(`/api/recipes/suggest?${search.toString()}`);
  },

  daily: (householdId: string) =>
    apiRequest<Recipe>(`/api/recipes/daily?household_id=${householdId}`),

  missing: (recipeName: string, householdId: string) =>
    apiRequest<{ recipe_name: string; missing: RecipeIngredient[] }>(
      `/api/recipes/${encodeURIComponent(recipeName)}/missing?household_id=${householdId}`,
    ),

  cook: (householdId: string, recipeName: string, ingredients: RecipeIngredient[]) =>
    apiRequest<CookResult>("/api/recipes/cook", {
      method: "POST",
      body: JSON.stringify({
        household_id: householdId,
        recipe_name: recipeName,
        consume_ingredients: ingredients,
      }),
    }),

  addMissingToShopping: (householdId: string, recipeName: string) =>
    apiRequest<{ added: number }>("/api/shopping-lists/from-recipe", {
      method: "POST",
      body: JSON.stringify({ household_id: householdId, recipe_name: recipeName }),
    }),
};

