"use client";

import { useEffect, useState, useCallback } from "react";
import { ChefHat, UtensilsCrossed, Filter, Sparkles, Loader2, Plus, CheckCircle2, Flame, AlertTriangle } from "lucide-react";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { NoHouseholdGuard } from "@/features/household/components/no-household-guard";
import { useTranslate } from "@/lib/i18n-context";
import { recipesApi, type Recipe } from "@/features/recipes/infrastructure/recipes.service";
import { RecipeDetailSheet } from "@/features/recipes/components/recipe-detail-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DIETARY_OPTIONS = [
  "vegetarian",
  "vegan",
  "gluten_free",
  "dairy_free",
  "high_protein",
  "low_carb",
] as const;

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

const PAGE_SIZE = 6;

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

function RecipeCard({ recipe, onOpen }: { recipe: Recipe; onOpen: (r: Recipe) => void }) {
  const { t } = useTranslate();
  const urgentCount = recipe.have_ingredients.filter((i) => i.is_urgent).length;
  return (
    <button
      onClick={() => onOpen(recipe)}
      className="w-full text-left rounded-xl bg-card ring-1 ring-foreground/5 shadow-card hover:shadow-card-hover hover:ring-primary/30 transition-all p-5 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold">{recipe.name}</h2>
          {recipe.description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{recipe.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={cn("text-2xl font-semibold tabular-nums leading-none", pctColor(recipe.match_pct))}>
            {Math.round(recipe.match_pct)}<span className="text-sm text-muted-foreground">%</span>
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {t("recipes.match")}
          </span>
        </div>
      </div>

      {/* Score bars */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span className="flex items-center gap-1"><CheckCircle2 className="size-2.5" /> {t("recipes.match")}</span>
            <span className="tabular-nums">{Math.round(recipe.match_pct)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full", pctBar(recipe.match_pct))} style={{ width: `${recipe.match_pct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span className="flex items-center gap-1"><Flame className="size-2.5" /> {t("recipes.waste_rescue_short")}</span>
            <span className="tabular-nums">{Math.round(recipe.waste_rescue_score)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-urgent" style={{ width: `${recipe.waste_rescue_score}%` }} />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {recipe.source === "ai" && (
          <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full px-1.5 py-0.5 bg-primary/10 text-primary flex items-center gap-1">
            <Sparkles className="size-2.5" /> {t("recipes.source_ai")}
          </span>
        )}
        {recipe.source === "fallback" && (
          <span className="text-[10px] font-medium uppercase tracking-wider rounded-full px-1.5 py-0.5 bg-muted text-muted-foreground">
            {t("recipes.source_fallback")}
          </span>
        )}
        {recipe.difficulty && (
          <span className="text-[10px] font-medium uppercase tracking-wider rounded-full px-1.5 py-0.5 bg-muted text-muted-foreground">
            {recipe.difficulty}
          </span>
        )}
        {recipe.max_time_minutes != null && (
          <span className="text-[10px] font-medium uppercase tracking-wider rounded-full px-1.5 py-0.5 bg-muted text-muted-foreground">
            {recipe.max_time_minutes}m
          </span>
        )}
        {recipe.have_ingredients.length > 0 && (
          <span className="text-[10px] font-medium rounded-full px-1.5 py-0.5 bg-safe-bg text-safe">
            {t("recipes.have_count", { n: recipe.have_ingredients.length })}
          </span>
        )}
        {recipe.need_ingredients.length > 0 && (
          <span className="text-[10px] font-medium rounded-full px-1.5 py-0.5 bg-attention-bg text-attention">
            {t("recipes.need_count", { n: recipe.need_ingredients.length })}
          </span>
        )}
        {urgentCount > 0 && (
          <span className="text-[10px] font-medium rounded-full px-1.5 py-0.5 bg-urgent-bg text-urgent flex items-center gap-1">
            <AlertTriangle className="size-2.5" /> {t("recipes.urgent_count", { n: urgentCount })}
          </span>
        )}
      </div>
    </button>
  );
}

export default function RecipesPage() {
  const { t } = useTranslate();
  const { activeHousehold, loadHouseholds } = useHouseholdStore();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [maxTime, setMaxTime] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [dietary, setDietary] = useState<string[]>([]);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => { loadHouseholds(); }, [loadHouseholds]);

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      if (!activeHousehold) return;
      if (append) setLoadingMore(true); else setLoading(true);
      try {
        const params: Parameters<typeof recipesApi.suggest>[1] = {
          limit: PAGE_SIZE,
          offset,
        };
        const time = Number(maxTime);
        if (maxTime && Number.isFinite(time) && time > 0) params.max_time = time;
        if (difficulty) params.difficulty = difficulty;
        if (dietary.length > 0) params.dietary = dietary;
        const res = await recipesApi.suggest(activeHousehold.id, params);
        setTotal(res.total);
        setRecipes((prev) => append ? [...prev, ...res.recipes] : res.recipes);
      } catch {
        if (!append) setRecipes([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeHousehold, maxTime, difficulty, dietary],
  );

  useEffect(() => {
    setRecipes([]);
    fetchPage(0, false);
  }, [fetchPage]);

  const openRecipe = (r: Recipe) => {
    setSelected(r);
    setSheetOpen(true);
  };

  const handleCooked = () => {
    // refresh after cooking
    setSheetOpen(false);
    setTimeout(() => fetchPage(0, false), 100);
  };

  const canLoadMore = recipes.length < total;

  return (
    <NoHouseholdGuard>
      <div className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <ChefHat className="size-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight">{t("recipes.title")}</h1>
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="size-3.5" /> {t("recipes.filters")}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">{t("recipes.from_your_food")}</p>

          {showFilters && (
            <div className="rounded-xl bg-card ring-1 ring-foreground/5 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("recipes.max_time")}</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder={t("recipes.max_time_placeholder")}
                    value={maxTime}
                    onChange={(e) => setMaxTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("recipes.difficulty")}</Label>
                  <Select value={difficulty || "any"} onValueChange={(v) => setDifficulty(v && v !== "any" ? v : "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t("recipes.any")}</SelectItem>
                      {DIFFICULTIES.map((d) => (
                        <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("recipes.dietary")}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {DIETARY_OPTIONS.map((d) => {
                    const on = dietary.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDietary((prev) => on ? prev.filter((x) => x !== d) : [...prev, d])}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                          on
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-accent",
                        )}
                      >
                        {d.replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="rounded-xl bg-card ring-1 ring-foreground/5 p-6 flex items-center gap-3">
              <Loader2 className="size-5 animate-spin text-primary" />
              <div className="text-sm">
                <p className="font-medium">{t("recipes.analyzing")}</p>
                <p className="text-xs text-muted-foreground">{t("recipes.analyzing_desc")}</p>
              </div>
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
            <>
              <div className="space-y-3">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} onOpen={openRecipe} />
                ))}
              </div>
              {canLoadMore && (
                <div className="flex justify-center pt-2">
                  <Button variant="outline" onClick={() => fetchPage(recipes.length, true)} disabled={loadingMore}>
                    {loadingMore ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                    {t("recipes.load_more")}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <RecipeDetailSheet
          recipe={selected}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onCooked={handleCooked}
        />
      </div>
    </NoHouseholdGuard>
  );
}
