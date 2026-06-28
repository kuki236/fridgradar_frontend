"use client";

import { useEffect, useState } from "react";
import { ChefHat, Clock, CheckCircle2, Plus, ShoppingCart, Loader2, Flame, AlertTriangle, Sparkles } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { recipesApi, type Recipe, type RecipeIngredient } from "@/features/recipes/infrastructure/recipes.service";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { useTranslate } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

interface RecipeDetailSheetProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCooked?: () => void;
}

function ingredientKey(ing: RecipeIngredient): string {
  return `${ing.name.toLowerCase()}|${ing.unit ?? ""}|${ing.quantity ?? ""}`;
}

function pctColor(pct: number) {
  if (pct >= 80) return "text-safe";
  if (pct >= 50) return "text-attention";
  return "text-urgent";
}

function pctBar(pct: number) {
  if (pct >= 80) return "bg-safe";
  if (pct >= 50) return "bg-attention";
  return "bg-urgent";
}

export function RecipeDetailSheet({ recipe, open, onOpenChange, onCooked }: RecipeDetailSheetProps) {
  const { t } = useTranslate();
  const { activeHousehold } = useHouseholdStore();
  const [cooking, setCooking] = useState(false);
  const [cookResult, setCookResult] = useState<string | null>(null);
  const [addingToList, setAddingToList] = useState(false);
  const [listMsg, setListMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCookResult(null);
      setListMsg(null);
    }
  }, [open, recipe?.id]);

  if (!recipe) return null;

  const handleCook = async () => {
    if (!activeHousehold) return;
    setCooking(true);
    setCookResult(null);
    try {
      const res = await recipesApi.cook(
        activeHousehold.id,
        recipe.name,
        recipe.have_ingredients,
      );
      const n = res.consumed.length;
      setCookResult(t("recipes.cooked", { n, name: recipe.name }));
      onCooked?.();
    } catch {
      setCookResult(t("recipes.cook_error"));
    }
    setCooking(false);
  };

  const handleAddMissing = async () => {
    if (!activeHousehold || recipe.need_ingredients.length === 0) return;
    setAddingToList(true);
    setListMsg(null);
    try {
      const res = await recipesApi.addMissingToShopping(activeHousehold.id, recipe.name);
      setListMsg(t("recipes.added_to_list", { n: res.added }));
    } catch {
      setListMsg(t("recipes.add_to_list_error"));
    }
    setAddingToList(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="border-b">
          <div className="flex items-center gap-2">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <ChefHat className="size-5 text-primary" />
              {recipe.name}
            </SheetTitle>
          </div>
          <SheetDescription>{recipe.description}</SheetDescription>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {recipe.source === "ai" && (
              <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full px-1.5 py-0.5 bg-primary/10 text-primary flex items-center gap-1">
                <Sparkles className="size-2.5" /> {t("recipes.source_ai")}
              </span>
            )}
            {recipe.difficulty && (
              <span className="text-[10px] font-medium uppercase tracking-wider rounded-full px-1.5 py-0.5 bg-muted text-muted-foreground">
                {recipe.difficulty}
              </span>
            )}
            {recipe.max_time_minutes != null && (
              <span className="text-[10px] font-medium uppercase tracking-wider rounded-full px-1.5 py-0.5 bg-muted text-muted-foreground flex items-center gap-1">
                <Clock className="size-2.5" /> {recipe.max_time_minutes}m
              </span>
            )}
            {recipe.dietary.slice(0, 3).map((d) => (
              <span key={d} className="text-[10px] font-medium rounded-full px-1.5 py-0.5 bg-safe-bg text-safe">
                {d}
              </span>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Score block */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-card ring-1 ring-foreground/5 p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wider">
                <CheckCircle2 className="size-3" /> {t("recipes.match")}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={cn("text-2xl font-semibold tabular-nums", pctColor(recipe.match_pct))}>
                  {Math.round(recipe.match_pct)}
                </span>
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {t("recipes.match_detail", {
                  have: recipe.have_ingredients.length,
                  total: recipe.have_ingredients.length + recipe.need_ingredients.length,
                })}
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", pctBar(recipe.match_pct))} style={{ width: `${recipe.match_pct}%` }} />
              </div>
            </div>

            <div className="rounded-lg bg-card ring-1 ring-foreground/5 p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wider">
                <Flame className="size-3" /> {t("recipes.waste_rescue")}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={cn("text-2xl font-semibold tabular-nums", recipe.waste_rescue_score > 0 ? "text-urgent" : "text-muted-foreground")}>
                  {Math.round(recipe.waste_rescue_score)}
                </span>
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {t("recipes.waste_rescue_detail")}
              </div>
              {recipe.have_ingredients.filter((i) => i.is_urgent).length > 0 && (
                <div className="mt-1.5 text-[10px] text-urgent flex items-center gap-1">
                  <AlertTriangle className="size-2.5" />
                  {t("recipes.uses_urgent", { n: recipe.have_ingredients.filter((i) => i.is_urgent).length })}
                </div>
              )}
            </div>
          </div>

          {/* Have */}
          {recipe.have_ingredients.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="size-3 text-safe" />
                {t("recipes.have")} ({recipe.have_ingredients.length})
              </h3>
              <ul className="space-y-1 rounded-lg bg-safe-bg/20 ring-1 ring-safe/30 p-2">
                {recipe.have_ingredients.map((ing, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-2 text-sm px-2 py-1.5">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="size-1.5 rounded-full bg-safe shrink-0" />
                      <span className="truncate">{ing.name}</span>
                      {ing.is_urgent && (
                        <span className="text-[10px] text-urgent font-medium shrink-0">!</span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {ing.quantity ?? "?"} {ing.unit ?? ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Need */}
          {recipe.need_ingredients.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Plus className="size-3 text-attention" />
                {t("recipes.need")} ({recipe.need_ingredients.length})
              </h3>
              <ul className="space-y-1 rounded-lg bg-attention-bg/20 ring-1 ring-attention/30 p-2">
                {recipe.need_ingredients.map((ing, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-2 text-sm px-2 py-1.5">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="size-1.5 rounded-full bg-attention shrink-0" />
                      <span className="truncate">{ing.name}</span>
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {ing.quantity ?? "?"} {ing.unit ?? ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {cookResult && (
            <div className="rounded-lg bg-safe-bg/30 ring-1 ring-safe/40 px-3 py-2 text-sm text-safe-foreground flex items-center gap-2">
              <CheckCircle2 className="size-4 text-safe shrink-0" />
              <span>{cookResult}</span>
            </div>
          )}
          {listMsg && (
            <div className="rounded-lg bg-info-bg/30 ring-1 ring-info/40 px-3 py-2 text-sm flex items-center gap-2">
              <ShoppingCart className="size-4 text-info shrink-0" />
              <span>{listMsg}</span>
            </div>
          )}
        </div>

        <div className="border-t p-4 flex flex-col gap-2">
          {recipe.need_ingredients.length > 0 && (
            <Button
              variant="outline"
              onClick={handleAddMissing}
              disabled={addingToList || cooking}
            >
              {addingToList ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              {t("recipes.add_missing")}
            </Button>
          )}
          <Button
            onClick={handleCook}
            disabled={cooking || addingToList || recipe.have_ingredients.length === 0}
          >
            {cooking ? <Loader2 className="size-3.5 animate-spin" /> : <ChefHat className="size-3.5" />}
            {t("recipes.cook_it")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper to dedupe ingredients by name+unit+quantity
export function dedupeIngredients(ings: RecipeIngredient[]): RecipeIngredient[] {
  const seen = new Map<string, RecipeIngredient>();
  for (const ing of ings) {
    const k = ingredientKey(ing);
    if (!seen.has(k)) seen.set(k, ing);
  }
  return Array.from(seen.values());
}
