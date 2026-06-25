"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, ShoppingCart, Loader2, Check } from "lucide-react";
import { shoppingApi, type ShoppingItem } from "@/features/shopping/infrastructure/shopping.service";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { NoHouseholdGuard } from "@/features/household/components/no-household-guard";
import { useTranslate } from "@/lib/i18n-context";

export default function ShoppingPage() {
  const { t } = useTranslate();
  const { activeHousehold } = useHouseholdStore();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const loadItems = useCallback(() => {
    if (!activeHousehold) return;
    setLoading(true);
    shoppingApi.getCurrent(activeHousehold.id).then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [activeHousehold]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleAdd = async () => {
    if (!newName.trim() || !activeHousehold) return;
    setAdding(true);
    try {
      await shoppingApi.add(activeHousehold.id, newName.trim());
      setNewName("");
      loadItems();
    } catch {}
    setAdding(false);
  };

  const handleToggle = async (item: ShoppingItem) => {
    await shoppingApi.update(item.id, { checked: !item.checked }).catch(() => {});
    loadItems();
  };

  const handleDelete = async (id: string) => {
    await shoppingApi.delete(id).catch(() => {});
    loadItems();
  };

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <NoHouseholdGuard>
    <div className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">{t("shopping.title")}</h1>
          {!loading && items.length > 0 && (
            <span className="text-xs text-muted-foreground">{t("shopping.remaining", { count: unchecked.length })}</span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={t("shopping.add_placeholder")}
            className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none transition-colors"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors disabled:opacity-50 shrink-0"
          >
            {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {t("shopping.add")}
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="size-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium">{t("shopping.empty_title")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("shopping.empty_desc")}</p>
          </div>
        ) : (
          <div className="rounded-xl bg-card ring-1 ring-foreground/5 divide-y shadow-card overflow-hidden">
            {unchecked.map((item) => (
              <ShoppingRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
            {checked.length > 0 && (
              <>
                <div className="px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
                  {t("shopping.purchased")} ({checked.length})
                </div>
                {checked.map((item) => (
                  <ShoppingRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
    </NoHouseholdGuard>
  );
}

function ShoppingRow({ item, onToggle, onDelete }: { item: ShoppingItem; onToggle: (item: ShoppingItem) => void; onDelete: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors group">
      <button
        onClick={() => onToggle(item)}
        className={`size-5 rounded flex items-center justify-center shrink-0 transition-colors ${
          item.checked ? "bg-primary text-primary-foreground" : "border border-muted-foreground/30 hover:border-primary/50"
        }`}
      >
        {item.checked && <Check className="size-3" />}
      </button>
      <div className="flex-1 min-w-0">
        <span className={`text-sm ${item.checked ? "line-through text-muted-foreground/50" : ""}`}>{item.product_name}</span>
        {(item.quantity || item.unit) && (
          <span className="text-xs text-muted-foreground ml-2">{item.quantity} {item.unit}</span>
        )}
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="p-1.5 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-urgent/10 hover:text-urgent transition-all"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
