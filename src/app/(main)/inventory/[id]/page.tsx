"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Utensils, Trash2, RefreshCw, CalendarDays, MapPin, Package, Plus, Minus } from "lucide-react";
import { inventoryApi, type InventoryItem } from "@/features/inventory/infrastructure/inventory.service";
import { ExpiryBadge } from "@/features/inventory/components/expiry-badge";
import { StockStatusPill } from "@/features/inventory/components/stock-status-pill";
import { EditItemDialog } from "@/features/inventory/components/edit-item-dialog";
import { useTranslate } from "@/lib/i18n-context";

function getExpiryStatus(expiryDate?: string | null): { status: "safe" | "attention" | "urgent" | "expired"; label: string } {
  if (!expiryDate) return { status: "safe", label: "No expiry" };
  const now = new Date();
  const exp = new Date(expiryDate);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return { status: "expired", label: "Expired" };
  if (diffDays === 0) return { status: "urgent", label: "Today" };
  if (diffDays <= 3) return { status: "urgent", label: `${diffDays}d left` };
  if (diffDays <= 7) return { status: "attention", label: `${diffDays}d left` };
  return { status: "safe", label: `${diffDays}d left` };
}

const zoneLabels: Record<string, string> = {
  refrigerator: "Refrigerator", freezer: "Freezer", pantry: "Pantry", other: "Other",
};

export default function ItemDetailPage() {
  const { t } = useTranslate();
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [consumeQty, setConsumeQty] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    inventoryApi.get(id as string).then(setItem).catch(() => router.push("/inventory")).finally(() => setLoading(false));
  }, [id, router]);

  const refresh = async () => {
    const updated = await inventoryApi.get(id as string);
    setItem(updated);
  };

  const handleConsume = async () => {
    setActionLoading(true);
    await inventoryApi.consume(item!.id, consumeQty).catch(() => {});
    await refresh();
    setActionLoading(false);
  };

  const handleDiscard = async () => {
    setActionLoading(true);
    await inventoryApi.discard(item!.id).catch(() => {});
    await refresh();
    setActionLoading(false);
  };

  const handleRestock = async () => {
    setActionLoading(true);
    await inventoryApi.restock(item!.id, 1).catch(() => {});
    await refresh();
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="h-5 w-20 rounded bg-muted animate-pulse" />
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!item) return null;

  const expiry = getExpiryStatus(item.expiry_date);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        {t("inventory.detail.back")}
      </button>

      <div className="rounded-xl bg-card ring-1 ring-foreground/5 shadow-card p-5 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold">{item.product_name}</h1>
            {item.product_category && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{item.product_category}</span>
              </div>
            )}
          </div>
          <StockStatusPill status={item.status as "active" | "consumed" | "discarded" | "low"} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Package className="size-3" /> {t("inventory.detail.qty")}</span>
            <p className="text-sm font-medium">{item.quantity} {item.unit}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" /> {t("inventory.detail.zone")}</span>
            <p className="text-sm font-medium">{zoneLabels[item.zone_type] || item.zone_type}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="size-3" /> {t("inventory.detail.expiry")}</span>
            <div className="mt-1">
              <ExpiryBadge status={expiry.status} date={item.expiry_date!} />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="size-3" /> {t("inventory.detail.purchased")}</span>
            <p className="text-sm text-muted-foreground">
              {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : t("inventory.detail.not_recorded")}
            </p>
          </div>
        </div>

        {item.status === "active" && (
          <div className="pt-3 border-t border-border/50 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setConsumeQty(Math.max(0.5, consumeQty - 0.5))}
                className="size-7 rounded-lg border border-input flex items-center justify-center hover:bg-accent transition-colors"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="text-sm font-medium w-12 text-center tabular-nums">{consumeQty}</span>
              <button
                onClick={() => setConsumeQty(consumeQty + 0.5)}
                className="size-7 rounded-lg border border-input flex items-center justify-center hover:bg-accent transition-colors"
              >
                <Plus className="size-3.5" />
              </button>
              <button onClick={handleConsume} disabled={actionLoading} className="inline-flex items-center gap-1.5 px-3 h-7 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/80 transition-colors disabled:opacity-50">
                <Utensils className="size-3.5" /> {t("inventory.detail.consume")}
              </button>
              <button onClick={handleDiscard} disabled={actionLoading} className="inline-flex items-center gap-1.5 px-3 h-7 rounded-lg border border-input text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50">
                <Trash2 className="size-3.5" /> {t("inventory.detail.discard")}
              </button>
              <button onClick={handleRestock} disabled={actionLoading} className="inline-flex items-center gap-1.5 px-3 h-7 rounded-lg border border-input text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50">
                <RefreshCw className="size-3.5" /> +1
              </button>
              <div className="ml-auto">
                <EditItemDialog item={item} onUpdated={setItem} />
              </div>
            </div>
          </div>
        )}

        {item.status !== "active" && (
          <div className="pt-3 border-t border-border/50 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {t("inventory.detail.item_was", { status: item.status })}
            </p>
            <EditItemDialog item={item} onUpdated={setItem} />
          </div>
        )}

        {item.status !== "active" && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              {t("inventory.detail.item_was", { status: item.status })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
