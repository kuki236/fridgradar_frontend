"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle, ShoppingCart, Archive, ArrowRight, Loader2,
  Clock, ChefHat, Sparkles,
} from "lucide-react";
import { inventoryApi, type InventoryItem } from "@/features/inventory/infrastructure/inventory.service";
import { alertApi, type Alert } from "@/features/alerts/infrastructure/alerts.service";
import { shoppingApi, type ShoppingItem } from "@/features/shopping/infrastructure/shopping.service";
import { recipesApi, type Recipe } from "@/features/recipes/infrastructure/recipes.service";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { AddItemDialog } from "@/features/inventory/components/add-item-dialog";
import { ExpiryBadge } from "@/features/inventory/components/expiry-badge";
import { NoHouseholdGuard } from "@/features/household/components/no-household-guard";
import { PageHeader } from "@/components/layout/page-header";
import { useTranslate } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { toBadgeStatus } from "@/features/inventory/lib/expiry-status";

const DASHBOARD_PREVIEW_LIMIT = 3;

function daysUntil(date: string): number {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function HomePage() {
  const { t } = useTranslate();
  const { activeHousehold, loadHouseholds } = useHouseholdStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHouseholds(); }, []);

  const [dailyRecipe, setDailyRecipe] = useState<Recipe | null>(null);

  const loadData = useCallback(async () => {
    if (!activeHousehold) return;
    setLoading(true);
    try {
      const [its, als, sls, recs, daily] = await Promise.all([
        inventoryApi.list(activeHousehold.id).catch(() => [] as InventoryItem[]),
        alertApi.list(activeHousehold.id).catch(() => [] as Alert[]),
        shoppingApi.getCurrent(activeHousehold.id).catch(() => [] as ShoppingItem[]),
        recipesApi
          .suggest(activeHousehold.id)
          .then((r) => r.recipes ?? [])
          .catch(() => [] as Recipe[]),
        recipesApi.daily(activeHousehold.id).catch(() => null),
      ]);
      setItems(its);
      setAlerts(als);
      setShoppingItems(sls);
      setDailyRecipe(daily);
      setRecipes(recs.slice(0, DASHBOARD_PREVIEW_LIMIT));
    } catch {}
    setLoading(false);
  }, [activeHousehold]);

  useEffect(() => { if (activeHousehold) loadData(); }, [activeHousehold, loadData]);

  // RF-CAD-006 / RF-CAD-019: unified alert count.
  // The "Alertas" KPI and the "Atención necesaria" card MUST use the same
  // number. We use the full list of open alerts so both match exactly.
  const totalAlerts = alerts.length;
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");

  // Split inventory by expiry so Vencidos and Por vencer don't mix.
  const expiredItems = items
    .filter(
      (i) =>
        i.status === "active" &&
        i.expiry_date &&
        daysUntil(i.expiry_date) <= 0,
    )
    .sort((a, b) => (a.expiry_date || "").localeCompare(b.expiry_date || ""));

  const expiringSoon = items
    .filter(
      (i) =>
        i.status === "active" &&
        i.expiry_date &&
        daysUntil(i.expiry_date) > 0 &&
        daysUntil(i.expiry_date) <= 3,
    )
    .sort((a, b) => (a.expiry_date || "").localeCompare(b.expiry_date || ""));

  const uncheckedShopping = shoppingItems.filter((i) => !i.checked);
  const activeItems = items.filter((i) => i.status === "active");

  const summaryCards = [
    {
      href: "/inventory",
      icon: Archive,
      value: activeItems.length,
      label: t("home.items"),
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      // RF-CAD-006: same number as the "Atención necesaria" card.
      href: "/alerts",
      icon: AlertTriangle,
      value: totalAlerts,
      label: t("home.alerts_count"),
      color: "text-urgent",
      bg: "bg-urgent-bg",
    },
    {
      href: "/expiry",
      icon: Clock,
      value: expiringSoon.length,
      label: t("home.expiring_soon"),
      color: "text-attention",
      bg: "bg-attention-bg",
    },
    {
      href: "/shopping",
      icon: ShoppingCart,
      value: uncheckedShopping.length,
      label: t("home.to_buy"),
      color: "text-info",
      bg: "bg-info-bg",
    },
  ];

  return (
    <NoHouseholdGuard>
      <div className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <PageHeader
            title={t("home.title")}
            subtitle={activeHousehold?.name}
            actions={<AddItemDialog onAdded={loadData} />}
          />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Big "Tengo hambre" CTA (RF-REC-011) */}
              <Link
                href="/recipes"
                className="group block rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-5 shadow-card hover:shadow-card-hover transition-all relative overflow-hidden"
              >
                <div className="absolute -right-6 -top-6 size-32 rounded-full bg-primary-foreground/10 blur-2xl" />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">
                      {t("recipes.tengo_hambre")}
                    </p>
                    <p className="text-base font-semibold mt-0.5">
                      {t("recipes.tengo_hambre_subtitle")}
                    </p>
                    {recipes.length > 0 && (
                      <p className="text-xs opacity-90 mt-1.5">
                        {t("recipes.match")} {Math.round(recipes[0].match_pct)}% — {recipes[0].name}
                      </p>
                    )}
                  </div>
                  <div className="size-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <ChefHat className="size-6" />
                  </div>
                </div>
              </Link>

              {/* Recipe of the day (RF-REC-019) */}
              {dailyRecipe && (
                <Link
                  href="/recipes"
                  className="group block rounded-xl bg-card ring-1 ring-foreground/5 p-4 shadow-card hover:shadow-card-hover hover:ring-primary/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                          {t("recipes.recipe_of_day")}
                        </p>
                      </div>
                      <p className="text-sm font-semibold truncate">{dailyRecipe.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {t("recipes.recipe_of_day_subtitle")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-semibold tabular-nums text-primary leading-none">
                        {Math.round(dailyRecipe.match_pct)}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">{t("recipes.match")}</p>
                    </div>
                  </div>
                </Link>
              )}

              {/* KPI grid (RF-CAD-006: alert count is unified) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {summaryCards.map((card) => (
                  <Link
                    key={card.label}
                    href={card.href}
                    className="rounded-xl bg-card p-4 ring-1 ring-foreground/5 hover:ring-primary/30 hover:-translate-y-0.5 hover:shadow-card-hover transition-all shadow-card group"
                  >
                    <div className={cn("size-8 rounded-lg flex items-center justify-center mb-3 transition-colors", card.bg, "group-hover:bg-primary/15")}>
                      <card.icon className={cn("size-4.5", card.color)} />
                    </div>
                    <div className="text-2xl font-semibold tabular-nums">{card.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
                  </Link>
                ))}
              </div>

              {/* Critical banner for expired items (RF-CAD-014) */}
              {criticalAlerts.length > 0 && (
                <Link
                  href="/alerts"
                  className="block rounded-xl bg-urgent text-urgent-foreground p-4 shadow-card hover:shadow-card-hover hover:brightness-95 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-urgent-foreground/15 flex items-center justify-center shrink-0">
                      <AlertTriangle className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">
                        {criticalAlerts.length === 1
                          ? t("home.expired_items", { count: criticalAlerts.length })
                          : t("home.expired_items_plural", { count: criticalAlerts.length })}
                      </p>
                      <p className="text-xs opacity-90 mt-0.5">
                        {criticalAlerts.slice(0, 3).map((a) => a.product_name).filter(Boolean).join(", ")}
                        {criticalAlerts.length > 3 && ` +${criticalAlerts.length - 3}`}
                      </p>
                    </div>
                    <div className="size-8 rounded-lg bg-urgent-foreground/15 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <ArrowRight className="size-4" />
                    </div>
                  </div>
                </Link>
              )}

              {/* Vencidos — dedicated section (RF-CAD-019) */}
              {expiredItems.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-urgent" />
                      <h2 className="text-sm font-medium text-urgent">
                        {t("home.expired_section")} ({expiredItems.length})
                      </h2>
                    </div>
                    <Link href="/expiry" className="text-xs text-primary hover:underline">
                      {t("home.view_all")}
                    </Link>
                  </div>
                  <div className="rounded-xl bg-urgent-bg/40 ring-1 ring-urgent/20 divide-y divide-urgent/15 overflow-hidden">
                    {expiredItems.slice(0, DASHBOARD_PREVIEW_LIMIT).map((item) => (
                      <Link
                        key={item.id}
                        href={`/inventory/${item.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-urgent-bg/60 transition-colors group"
                      >
                        <ExpiryBadge status={toBadgeStatus(item.expiry_status)} date={item.expiry_date!} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} {item.unit} &middot; {item.zone_name}
                          </p>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Por vencer — only future expirations (RF-CAD-019) */}
              {expiringSoon.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-attention" />
                      <h2 className="text-sm font-medium">{t("home.expiring_soon")}</h2>
                    </div>
                    <Link href="/expiry" className="text-xs text-primary hover:underline">
                      {t("home.view_all")}
                    </Link>
                  </div>
                  <div className="rounded-xl bg-card ring-1 ring-foreground/5 divide-y shadow-card overflow-hidden">
                    {expiringSoon.slice(0, DASHBOARD_PREVIEW_LIMIT).map((item) => (
                      <Link
                        key={item.id}
                        href={`/inventory/${item.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="size-2 rounded-full bg-attention shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} {item.unit} &middot; {item.zone_name}
                          </p>
                        </div>
                        <ExpiryBadge status={toBadgeStatus(item.expiry_status)} date={item.expiry_date!} />
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Lista de compras — max 3 + Ver todo */}
              {uncheckedShopping.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="size-4 text-info" />
                      <h2 className="text-sm font-medium">{t("home.shopping_list")}</h2>
                    </div>
                    <Link href="/shopping" className="text-xs text-primary hover:underline">
                      {t("home.view_all")}
                    </Link>
                  </div>
                  <div className="rounded-xl bg-card ring-1 ring-foreground/5 divide-y shadow-card overflow-hidden">
                    {uncheckedShopping.slice(0, DASHBOARD_PREVIEW_LIMIT).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="size-4 rounded border border-muted-foreground/30" />
                        <span className="text-sm">{item.product_name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Sugerencias de recetas — max 3 + Ver todo (RF-REC-013) */}
              {recipes.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ChefHat className="size-4 text-muted-foreground" />
                      <h2 className="text-sm font-medium">{t("recipes.suggest")}</h2>
                    </div>
                    <Link href="/recipes" className="text-xs text-primary hover:underline">
                      {t("home.view_all")}
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recipes.slice(0, DASHBOARD_PREVIEW_LIMIT).map((recipe) => {
                      const have = recipe.have_ingredients?.length ?? 0;
                      const need = recipe.need_ingredients?.length ?? 0;
                      const total = have + need;
                      const pct = total > 0 ? Math.round((have / total) * 100) : 0;
                      return (
                        <Link
                          key={recipe.id}
                          href="/recipes"
                          className="rounded-xl bg-card ring-1 ring-foreground/5 p-4 shadow-card hover:ring-primary/30 hover:shadow-card-hover hover:-translate-y-0.5 transition-all group"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <ChefHat className="size-4 text-primary" />
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              {recipe.source === "ai" ? t("recipes.source_ai") : t("recipes.source_fallback")}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold truncate mb-1">{recipe.name}</h3>
                          {recipe.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                              {recipe.description}
                            </p>
                          )}
                          {total > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-muted-foreground">
                                  {t("recipes.have_of_total", { have, total })}
                                </span>
                                <span className="font-semibold text-primary tabular-nums">
                                  {pct}%
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {activeItems.length === 0 && alerts.length === 0 && uncheckedShopping.length === 0 && (
                <div className="text-center py-16 animate-in fade-in duration-500">
                  <div className="size-14 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="size-7 text-primary/60" />
                  </div>
                  <h3 className="text-base font-medium mb-1">{t("home.empty_title")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t("home.empty_desc")}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </NoHouseholdGuard>
  );
}
