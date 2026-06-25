"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle, ShoppingCart, Archive, ArrowRight, Loader2,
  Refrigerator, Plus, Users, Bell, Clock, TrendingUp,
  ChefHat, Sparkles, Activity,
} from "lucide-react";
import { inventoryApi, type InventoryItem } from "@/features/inventory/infrastructure/inventory.service";
import { alertApi, type Alert } from "@/features/alerts/infrastructure/alerts.service";
import { shoppingApi, type ShoppingItem } from "@/features/shopping/infrastructure/shopping.service";
import { activityApi, type ActivityEntry } from "@/features/activity/infrastructure/activity.service";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { AddItemDialog } from "@/features/inventory/components/add-item-dialog";
import { ExpiryBadge } from "@/features/inventory/components/expiry-badge";
import { NoHouseholdGuard } from "@/features/household/components/no-household-guard";
import { useTranslate } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

function daysUntil(date: string): number {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function statusForExpiry(date: string | null): "safe" | "attention" | "urgent" {
  if (!date) return "safe";
  const d = daysUntil(date);
  if (d <= 0) return "urgent";
  if (d <= 3) return "attention";
  return "safe";
}

function timeAgo(date: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("home.just_now");
  if (mins < 60) return t("home.m_ago", { m: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("home.h_ago", { h: hours });
  const days = Math.floor(hours / 24);
  return t("home.d_ago", { d: days });
}

export default function HomePage() {
  const { t } = useTranslate();
  const { activeHousehold, loadHouseholds } = useHouseholdStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHouseholds(); }, []);

  const loadData = useCallback(async () => {
    if (!activeHousehold) return;
    setLoading(true);
    try {
      const [its, als, sls, acts, recs] = await Promise.all([
        inventoryApi.list(activeHousehold.id).catch(() => [] as InventoryItem[]),
        alertApi.list(activeHousehold.id).catch(() => [] as Alert[]),
        shoppingApi.getCurrent(activeHousehold.id).catch(() => [] as ShoppingItem[]),
        activityApi.list(activeHousehold.id, 10).catch(() => [] as ActivityEntry[]),
        fetch(`/api/recipes/suggest?household_id=${activeHousehold.id}`)
          .then((r) => r.ok ? r.json() : [])
          .then((d) => Array.isArray(d) ? d : d.recipes ?? [])
          .catch(() => []),
      ]);
      setItems(its);
      setAlerts(als);
      setShoppingItems(sls);
      setActivityEntries(acts);
      setRecipes(recs.slice(0, 3));
    } catch {}
    setLoading(false);
  }, [activeHousehold]);

  useEffect(() => { if (activeHousehold) loadData(); }, [activeHousehold, loadData]);

  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const warningAlerts = alerts.filter((a) => a.severity === "warning");
  const expiringSoon = items
    .filter((i) => i.status === "active" && i.expiry_date && daysUntil(i.expiry_date) <= 3)
    .sort((a, b) => (a.expiry_date || "").localeCompare(b.expiry_date || ""));
  const uncheckedShopping = shoppingItems.filter((i) => !i.checked);
  const activeItems = items.filter((i) => i.status === "active");

  const totalAlerts = criticalAlerts.length + warningAlerts.length;

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 86400000);
  const expiringThisWeek = items
    .filter((i) => i.status === "active" && i.expiry_date && new Date(i.expiry_date) <= nextWeek && daysUntil(i.expiry_date) > 0)
    .sort((a, b) => (a.expiry_date || "").localeCompare(b.expiry_date || ""));

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
      href: "/alerts",
      icon: AlertTriangle,
      value: totalAlerts,
      label: t("home.alerts_count"),
      color: "text-urgent",
      bg: "bg-urgent-bg",
    },
    {
      href: "/inventory",
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{t("home.title")}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{activeHousehold?.name}</p>
            </div>
            <AddItemDialog onAdded={loadData} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {summaryCards.map((card) => (
                  <Link
                    key={card.label}
                    href={card.href}
                    className="rounded-xl bg-card p-4 ring-1 ring-foreground/5 hover:ring-primary/30 transition-all shadow-card hover:shadow-card-hover group"
                  >
                    <div className={cn("size-8 rounded-lg flex items-center justify-center mb-3", card.bg)}>
                      <card.icon className={cn("size-4.5", card.color)} />
                    </div>
                    <div className="text-2xl font-semibold tabular-nums">{card.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
                  </Link>
                ))}
              </div>

              {criticalAlerts.length > 0 && (
                <Link
                  href="/alerts"
                  className="block rounded-xl bg-urgent-bg/30 ring-1 ring-urgent/20 p-4 hover:bg-urgent-bg/40 transition-all group animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="size-5 text-urgent shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-urgent">
                        {criticalAlerts.length === 1
                          ? t("home.expired_items", { count: criticalAlerts.length })
                          : t("home.expired_items_plural", { count: criticalAlerts.length })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {criticalAlerts.slice(0, 3).map((a) => a.product_name).filter(Boolean).join(", ")}
                        {criticalAlerts.length > 3 && ` +${criticalAlerts.length - 3} more`}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              )}

              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-4 text-muted-foreground" />
                    <h2 className="text-sm font-medium">{t("home.at_a_glance")}</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeItems.length > 0 && (
                    <div className="rounded-xl bg-card ring-1 ring-foreground/5 p-4 shadow-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Refrigerator className="size-4 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("home.inventory")}</span>
                      </div>
                      <div className="text-lg font-semibold">{activeItems.length} items</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {["Dairy", "Vegetables", "Meat", "Fruits"].map((cat) => {
                          const count = activeItems.filter((i) => i.product_category === cat).length;
                          if (count === 0) return null;
                          return (
                            <span key={cat} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {cat} {count}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {uncheckedShopping.length > 0 && (
                    <div className="rounded-xl bg-card ring-1 ring-foreground/5 p-4 shadow-card">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart className="size-4 text-info" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("home.shopping_list")}</span>
                      </div>
                      <div className="text-lg font-semibold">{uncheckedShopping.length} items</div>
                      <div className="mt-2 space-y-1">
                        {uncheckedShopping.slice(0, 4).map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <div className="size-3 rounded border border-muted-foreground/30" />
                            <span className="text-xs text-foreground/80">{item.product_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {alerts.length > 0 && (
                    <div className="rounded-xl bg-card ring-1 ring-foreground/5 p-4 shadow-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="size-4 text-attention" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("home.needs_attention")}</span>
                      </div>
                      <div className="text-lg font-semibold">{alerts.length} {t("home.alerts")}</div>
                      <div className="mt-2 space-y-1">
                        {alerts.slice(0, 4).map((alert) => (
                          <div key={alert.id} className="flex items-center gap-2">
                            <span className={cn("size-1.5 rounded-full shrink-0", alert.severity === "critical" ? "bg-urgent" : alert.severity === "warning" ? "bg-attention" : "bg-info")} />
                            <span className="text-xs text-foreground/80 truncate">{alert.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activityEntries.length > 0 && (
                    <div className="rounded-xl bg-card ring-1 ring-foreground/5 p-4 shadow-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="size-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("home.recent")}</span>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        {activityEntries.slice(0, 4).map((entry) => (
                          <div key={entry.id} className="flex items-center gap-2 text-xs">
                            <span className="size-1.5 rounded-full bg-primary/50 shrink-0" />
                            <span className="text-foreground/80 truncate">
                              <span className="font-medium">{entry.actor_name || t("home.someone")}</span>
                              {" "}{entry.action}{" "}
                              <span className="capitalize">{entry.entity_type.replace("_", " ")}</span>
                            </span>
                            <span className="text-muted-foreground shrink-0">{timeAgo(entry.created_at, t)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {expiringSoon.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium">{t("home.expiring_soon")}</h2>
                    <Link href="/inventory" className="text-xs text-primary hover:underline">{t("home.view_all")}</Link>
                  </div>
                  <div className="rounded-xl bg-card ring-1 ring-foreground/5 divide-y shadow-card overflow-hidden">
                    {expiringSoon.slice(0, 5).map((item) => (
                      <Link key={item.id} href={`/inventory/${item.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                        <div className={cn("size-2 rounded-full shrink-0", statusForExpiry(item.expiry_date) === "urgent" ? "bg-urgent" : "bg-attention")} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} &middot; {item.zone_name}</p>
                        </div>
                        <ExpiryBadge status={statusForExpiry(item.expiry_date)} date={item.expiry_date!} />
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {expiringThisWeek.length > 0 && expiringSoon.length === 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium">{t("home.expiration_timeline")}</h2>
                    <Link href="/inventory" className="text-xs text-primary hover:underline">{t("home.view_all")}</Link>
                  </div>
                  <div className="rounded-xl bg-card ring-1 ring-foreground/5 divide-y shadow-card overflow-hidden">
                    {expiringThisWeek.slice(0, 5).map((item) => (
                      <Link key={item.id} href={`/inventory/${item.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                        <div className={cn("size-2 rounded-full shrink-0", statusForExpiry(item.expiry_date) === "urgent" ? "bg-urgent" : statusForExpiry(item.expiry_date) === "attention" ? "bg-attention" : "bg-safe")} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}</p>
                        </div>
                        <ExpiryBadge status={statusForExpiry(item.expiry_date)} date={item.expiry_date!} />
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {uncheckedShopping.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium">{t("home.shopping_list")}</h2>
                    <Link href="/shopping" className="text-xs text-primary hover:underline">{t("home.view_all")}</Link>
                  </div>
                  <div className="rounded-xl bg-card ring-1 ring-foreground/5 divide-y shadow-card overflow-hidden">
                    {uncheckedShopping.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="size-4 rounded border border-muted-foreground/30" />
                        <span className="text-sm">{item.product_name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {recipes.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ChefHat className="size-4 text-muted-foreground" />
                      <h2 className="text-sm font-medium">{t("recipes.suggest")}</h2>
                    </div>
                    <Link href="/recipes" className="text-xs text-primary hover:underline">{t("home.view_all")}</Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recipes.slice(0, 3).map((recipe: any) => (
                      <Link
                        key={recipe.id}
                        href="/recipes"
                        className="rounded-xl bg-card ring-1 ring-foreground/5 p-4 shadow-card hover:ring-primary/20 hover:shadow-card-hover transition-all group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <ChefHat className="size-4 text-primary" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {recipe.source === "ai" ? t("recipes.source_ai") : t("recipes.source_fallback")}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold truncate mb-1">{recipe.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{recipe.description}</p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          {recipe.have_ingredients?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-green-500" />
                              {t("recipes.have")} {recipe.have_ingredients.length}
                            </span>
                          )}
                          {recipe.need_ingredients?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              {t("recipes.need")} {recipe.need_ingredients.length}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="flex items-center gap-3 flex-wrap">
                <Link href="/inventory" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card ring-1 ring-foreground/5 hover:ring-primary/30 hover:shadow-card-hover transition-all text-sm font-medium">
                  <Archive className="size-4" />
                  {t("home.browse")}
                </Link>
                <Link href="/shopping" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card ring-1 ring-foreground/5 hover:ring-primary/30 hover:shadow-card-hover transition-all text-sm font-medium">
                  <ShoppingCart className="size-4" />
                  {t("home.shopping_list")}
                </Link>
                <Link href="/activity" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card ring-1 ring-foreground/5 hover:ring-primary/30 hover:shadow-card-hover transition-all text-sm font-medium">
                  <Activity className="size-4" />
                  {t("home.activity_log")}
                </Link>
              </section>

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
