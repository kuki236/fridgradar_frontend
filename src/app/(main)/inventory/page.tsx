"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Loader2, Archive, LayoutList, LayoutGrid } from "lucide-react";
import { inventoryApi, type InventoryItem } from "@/features/inventory/infrastructure/inventory.service";
import { refrigeratorApi, type Refrigerator } from "@/features/inventory/infrastructure/refrigerators.service";
import { zoneApi, type Zone } from "@/features/inventory/infrastructure/zones.service";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { InventoryItemCard } from "@/features/inventory/components/inventory-item-card";
import { FridgeSwitcher } from "@/features/inventory/components/fridge-switcher";
import { FridgeView } from "@/features/inventory/components/fridge-view";
import { AddItemDialog } from "@/features/inventory/components/add-item-dialog";
import { NoHouseholdGuard } from "@/features/household/components/no-household-guard";
import { useTranslate } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "visual";

export default function InventoryPage() {
  const { t } = useTranslate();
  const { activeHousehold } = useHouseholdStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [fridges, setFridges] = useState<Refrigerator[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [activeFridgeId, setActiveFridgeId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    if (activeHousehold) {
      refrigeratorApi.list(activeHousehold.id).then(setFridges).catch(() => {});
      zoneApi.list(activeHousehold.id).then(setZones).catch(() => {});
    }
  }, [activeHousehold]);

  // Always fetch the full household inventory. The fridge filter is applied
  // client-side using `item.refrigerator_id` (already returned by the backend).
  // The previous implementation sent the refrigerator id as `zone_id` to the
  // API, which silently returned an empty list because no inventory item has
  // a zone_id equal to a refrigerator id.
  const loadItems = useCallback(() => {
    if (!activeHousehold) return;
    setLoading(true);
    inventoryApi
      .list(activeHousehold.id)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeHousehold]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleItemMoved = useCallback((updated: InventoryItem) => {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  }, []);

  const filtered = items
    .filter((item) =>
      item.product_name.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((item) =>
      activeFridgeId ? item.refrigerator_id === activeFridgeId : true,
    )
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0));

  return (
    <NoHouseholdGuard>
    <div className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{t("inventory.title")}</h1>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg bg-muted p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
                title={t("inventory.view_list")}
                aria-label={t("inventory.view_list")}
              >
                <LayoutList className="size-4" />
              </button>
              <button
                onClick={() => setViewMode("visual")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "visual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
                title={t("inventory.view_visual")}
                aria-label={t("inventory.view_visual")}
              >
                <LayoutGrid className="size-4" />
              </button>
            </div>
            <AddItemDialog onAdded={loadItems} />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("inventory.search")}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none transition-colors"
            />
          </div>
          <FridgeSwitcher
            fridges={fridges}
            activeFridgeId={activeFridgeId}
            onFridgeChange={setActiveFridgeId}
            className="w-44"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : viewMode === "visual" ? (
          <FridgeView
            refrigerators={activeFridgeId ? fridges.filter((f) => f.id === activeFridgeId) : fridges}
            zones={activeFridgeId ? zones.filter((z) => z.refrigerator_id === activeFridgeId) : zones}
            items={filtered}
            onMoved={handleItemMoved}
          />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Archive className="size-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium">
              {search ? t("inventory.no_results") : activeFridgeId ? t("inventory.no_zone") : t("inventory.no_items")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? t("inventory.try_search") : t("inventory.add_first")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <Link key={item.id} href={`/inventory/${item.id}`} className="block">
                <InventoryItemCard
                  item={{
                    id: item.id,
                    productName: item.product_name,
                    category: item.product_category,
                    quantity: item.quantity,
                    unit: item.unit || undefined,
                    expiryDate: item.expiry_date || undefined,
                    expiryStatus: item.expiry_status,
                    zoneType: item.zone_type as "refrigerator" | "freezer" | "pantry" | "other",
                    status: item.status,
                    isLowStock: item.is_low_stock,
                  }}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
    </NoHouseholdGuard>
  );
}
