"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Loader2, Archive } from "lucide-react";
import { inventoryApi, type InventoryItem } from "@/features/inventory/infrastructure/inventory.service";
import { refrigeratorApi, type Refrigerator } from "@/features/inventory/infrastructure/refrigerators.service";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { InventoryItemCard } from "@/features/inventory/components/inventory-item-card";
import { FridgeSwitcher } from "@/features/inventory/components/fridge-switcher";
import { AddItemDialog } from "@/features/inventory/components/add-item-dialog";
import { NoHouseholdGuard } from "@/features/household/components/no-household-guard";
import { useTranslate } from "@/lib/i18n-context";

export default function InventoryPage() {
  const { t } = useTranslate();
  const { activeHousehold } = useHouseholdStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [fridges, setFridges] = useState<Refrigerator[]>([]);
  const [activeFridgeId, setActiveFridgeId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeHousehold) {
      refrigeratorApi.list(activeHousehold.id).then(setFridges).catch(() => {});
    }
  }, [activeHousehold]);

  const loadItems = useCallback(() => {
    if (!activeHousehold) return;
    setLoading(true);
    inventoryApi
      .list(activeHousehold.id, activeFridgeId || undefined)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeHousehold, activeFridgeId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const filtered = items.filter((item) =>
    item.product_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <NoHouseholdGuard>
    <div className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">{t("inventory.title")}</h1>
          <AddItemDialog onAdded={loadItems} />
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
                    category: item.product_category || undefined,
                    imageUrl: item.image_url || undefined,
                    quantity: item.quantity,
                    unit: item.unit || undefined,
                    expiryDate: item.expiry_date || undefined,
                    zoneType: item.zone_type as "refrigerator" | "freezer" | "pantry" | "other",
                    status: item.status as "active" | "consumed" | "discarded" | "low",
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
