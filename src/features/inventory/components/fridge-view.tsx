"use client";

import { useState } from "react";
import Link from "next/link";
import { Snowflake, Refrigerator as FridgeIcon, Box, ImageOff, GripVertical, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/lib/i18n-context";
import { ExpiryBadge } from "@/features/inventory/components/expiry-badge";
import { inventoryApi, type InventoryItem } from "@/features/inventory/infrastructure/inventory.service";
import { refrigeratorApi, type Refrigerator } from "@/features/inventory/infrastructure/refrigerators.service";
import { zoneApi, type Zone } from "@/features/inventory/infrastructure/zones.service";

interface FridgeViewProps {
  refrigerators: Refrigerator[];
  zones: Zone[];
  items: InventoryItem[];
  onMoved: (item: InventoryItem) => void;
}

const TYPE_ICONS = {
  refrigerator: FridgeIcon,
  freezer: Snowflake,
  pantry: Box,
  other: Box,
};

const TYPE_LABEL_KEYS = {
  refrigerator: "inventory.fridge",
  freezer: "inventory.freezer",
  pantry: "inventory.pantry",
  other: "inventory.zone",
};

function getExpiryStatus(dateStr?: string | null): "safe" | "attention" | "urgent" | "expired" {
  if (!dateStr) return "safe";
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0) return "expired";
  if (diff <= 3) return "urgent";
  if (diff <= 7) return "attention";
  return "safe";
}

function ItemCard({ item, onDragStart }: { item: InventoryItem; onDragStart: (e: React.DragEvent, id: string) => void }) {
  const { t } = useTranslate();
  const expiry = getExpiryStatus(item.expiry_date);
  return (
    <Link
      href={`/inventory/${item.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      className="group flex items-center gap-2 p-2 rounded-lg bg-card ring-1 ring-foreground/5 hover:ring-primary/30 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
    >
      <GripVertical className="size-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 shrink-0" />
      <div className="size-8 rounded bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
        {item.image_url ? (
          <img src={item.image_url} alt="" className="size-full object-cover" />
        ) : (
          <ImageOff className="size-3.5 text-muted-foreground/60" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{item.product_name}</p>
        <p className="text-[10px] text-muted-foreground tabular-nums">
          {item.quantity} {item.unit ?? ""}
        </p>
      </div>
      {item.expiry_date && (
        <ExpiryBadge status={expiry} label={`${item.days_left ?? "?"}d`} />
      )}
    </Link>
  );
}

function ZoneShelf({
  zone,
  items,
  onDrop,
  onDragStart,
  activeDropZone,
}: {
  zone: Zone;
  items: InventoryItem[];
  onDrop: (zoneId: string, itemId: string) => void;
  onDragStart: (e: React.DragEvent, itemId: string) => void;
  activeDropZone: string | null;
}) {
  const { t } = useTranslate();
  const isActive = activeDropZone === zone.id;
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.currentTarget.setAttribute("data-drop", zone.id);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          e.currentTarget.removeAttribute("data-drop");
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.removeAttribute("data-drop");
        const itemId = e.dataTransfer.getData("text/plain");
        if (itemId) onDrop(zone.id, itemId);
      }}
      className={cn(
        "rounded-lg border-2 border-dashed p-2 space-y-1.5 min-h-[3rem] transition-colors",
        isActive ? "border-primary bg-primary/5" : "border-border/50 bg-muted/20",
      )}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {zone.name}
        </span>
        <span className="text-[10px] text-muted-foreground/60 tabular-nums">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-[10px] text-muted-foreground/60 text-center py-2">
          {t("inventory.drop_here")}
        </p>
      ) : (
        items.map((item) => <ItemCard key={item.id} item={item} onDragStart={onDragStart} />)
      )}
    </div>
  );
}

export function FridgeView({ refrigerators, zones, items, onMoved }: FridgeViewProps) {
  const { t } = useTranslate();
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
  const [savingZone, setSavingZone] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData("text/plain", itemId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingItemId(itemId);
  };

  const handleDrop = async (zoneId: string, itemId: string) => {
    setDraggingItemId(null);
    setActiveDropZone(null);
    const item = items.find((it) => it.id === itemId);
    if (!item || item.zone_id === zoneId) return;
    setSavingZone(zoneId);
    try {
      const updated = await inventoryApi.update(itemId, { zone_id: zoneId });
      onMoved(updated);
    } catch {
      // error handled silently
    }
    setSavingZone(null);
  };

  const handleGlobalDragOver = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    const zoneEl = target.closest("[data-drop]") as HTMLElement | null;
    setActiveDropZone(zoneEl?.getAttribute("data-drop") ?? null);
  };

  const handleGlobalDragEnd = () => {
    setDraggingItemId(null);
    setActiveDropZone(null);
  };

  // Bucket items by zone, then group zones by refrigerator
  const itemsByZone = new Map<string, InventoryItem[]>();
  for (const it of items) {
    if (!itemsByZone.has(it.zone_id)) itemsByZone.set(it.zone_id, []);
    itemsByZone.get(it.zone_id)!.push(it);
  }

  const zonesByFridge = new Map<string | "no_fridge", Zone[]>();
  for (const z of zones) {
    const key = z.refrigerator_id ?? "no_fridge";
    if (!zonesByFridge.has(key)) zonesByFridge.set(key, []);
    zonesByFridge.get(key)!.push(z);
  }

  return (
    <div onDragOver={handleGlobalDragOver} onDragEnd={handleGlobalDragEnd} className="space-y-4">
      {refrigerators.map((fridge) => {
        const Icon = TYPE_ICONS[fridge.type] || FridgeIcon;
        const fridgeZones = zonesByFridge.get(fridge.id) ?? [];
        return (
          <section key={fridge.id} className="rounded-xl bg-card ring-1 ring-foreground/5 shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
              <Icon className="size-4 text-primary" />
              <h2 className="text-sm font-medium">{fridge.name}</h2>
              <span className="text-[10px] text-muted-foreground/60 ml-auto">
                {t(TYPE_LABEL_KEYS[fridge.type as keyof typeof TYPE_LABEL_KEYS] || "inventory.zone")}
              </span>
            </div>
            <div className="p-3 space-y-2">
              {fridgeZones.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 text-center py-4">
                  {t("inventory.no_zones")}
                </p>
              ) : (
                fridgeZones.map((z) => (
                  <ZoneShelf
                    key={z.id}
                    zone={z}
                    items={itemsByZone.get(z.id) ?? []}
                    onDrop={handleDrop}
                    onDragStart={handleDragStart}
                    activeDropZone={savingZone === z.id ? z.id : activeDropZone}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}

      {draggingItemId && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-lg z-50 flex items-center gap-1.5 animate-in fade-in">
          <Loader2 className="size-3 animate-spin" />
          {t("inventory.drag_to_move")}
        </div>
      )}
    </div>
  );
}
