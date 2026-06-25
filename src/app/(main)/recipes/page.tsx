"use client";

import { useEffect, useState } from "react";
import { ChefHat, Loader2, UtensilsCrossed } from "lucide-react";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { NoHouseholdGuard } from "@/features/household/components/no-household-guard";
import { useTranslate } from "@/lib/i18n-context";

interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string | null;
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  have_ingredients: RecipeIngredient[];
  need_ingredients: RecipeIngredient[];
  source: "ai" | "fallback";
}

export default function RecipesPage() {
  const { t } = useTranslate();
  const { activeHousehold } = useHouseholdStore();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeHousehold) return;
    setLoading(true);
    fetch(`/api/recipes/suggest?household_id=${activeHousehold.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => setRecipes(Array.isArray(data) ? data : data.recipes ?? []))
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  }, [activeHousehold]);

  return (
    <NoHouseholdGuard>
      <div className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center gap-3">
            <ChefHat className="size-5 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">{t("recipes.title")}</h1>
          </div>

          <p className="text-sm text-muted-foreground">{t("recipes.from_your_food")}</p>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl bg-card ring-1 ring-foreground/5 p-5 space-y-3">
                  <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-20">
              <div className="size-14 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="size-7 text-primary/60" />
              </div>
              <h3 className="text-base font-medium mb-1">{t("recipes.no_recipes")}</h3>
              <p className="text-sm text-muted-foreground">{t("recipes.no_recipes_desc")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="rounded-xl bg-card ring-1 ring-foreground/5 shadow-card p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-semibold">{recipe.name}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">{recipe.description}</p>
                    </div>
                    <span className="text-[10px] font-medium uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                      {recipe.source === "ai" ? t("recipes.source_ai") : t("recipes.source_fallback")}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recipe.have_ingredients.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                          {t("recipes.have")}
                        </p>
                        <ul className="space-y-1">
                          {recipe.have_ingredients.map((ing, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-xs text-foreground/80">
                              <span className="size-1.5 rounded-full bg-green-500 shrink-0" />
                              {ing.name}{ing.quantity ? ` - ${ing.quantity}` : ""}{ing.unit ? ` ${ing.unit}` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {recipe.need_ingredients.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                          {t("recipes.need")}
                        </p>
                        <ul className="space-y-1">
                          {recipe.need_ingredients.map((ing, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-xs text-foreground/80">
                              <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                              {ing.name}{ing.quantity ? ` - ${ing.quantity}` : ""}{ing.unit ? ` ${ing.unit}` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </NoHouseholdGuard>
  );
}
