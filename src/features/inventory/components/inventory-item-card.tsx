import { Snowflake, Refrigerator, Box, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/lib/i18n-context";
import { ExpiryBadge } from "@/features/inventory/components/expiry-badge";
import { StockStatusPill } from "@/features/inventory/components/stock-status-pill";
import { CategoryIcon } from "@/features/inventory/components/category-icon";
import { toBadgeStatus } from "@/features/inventory/lib/expiry-status";
import type { InventoryItemStatus } from "@/features/inventory/infrastructure/inventory.service";

type LocalInventoryItem = {
  id: string;
  productName: string;
  category?: string | null;
  quantity: number;
  unit?: string;
  expiryDate?: string;
  expiryStatus?: string | null;
  zoneType: "refrigerator" | "freezer" | "pantry" | "other";
  status: InventoryItemStatus;
  isLowStock: boolean;
};

const zoneIcons: Record<LocalInventoryItem["zoneType"], typeof Refrigerator> = {
  refrigerator: Refrigerator,
  freezer: Snowflake,
  pantry: Box,
  other: Box,
};

const zoneLabelKey: Record<LocalInventoryItem["zoneType"], string> = {
  refrigerator: "inventory.zone_refrigerator",
  freezer: "inventory.zone_freezer",
  pantry: "inventory.zone_pantry",
  other: "inventory.zone_other",
};

interface InventoryItemCardProps {
  item: LocalInventoryItem;
  className?: string;
}

const urgencyStyles: Record<string, string> = {
  expired: "bg-urgent-bg/30 ring-urgent/40 hover:ring-urgent/60",
  urgent: "bg-urgent-bg/15 ring-urgent/30 hover:ring-urgent/50",
  attention: "bg-attention-bg/15 ring-attention/30 hover:ring-attention/50",
  safe: "bg-card ring-foreground/5 hover:ring-primary/20",
};

export function InventoryItemCard({ item, className }: InventoryItemCardProps) {
  const { t } = useTranslate();
  const badgeStatus = toBadgeStatus(item.expiryStatus);
  const ZoneIcon = zoneIcons[item.zoneType];
  const ringClass = urgencyStyles[badgeStatus] ?? urgencyStyles.safe;

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-xl ring-1 shadow-card hover:shadow-card-hover transition-all", ringClass, className)}>
      <CategoryIcon category={item.category} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{item.productName}</p>
          {item.category && (
            <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{item.category}</span>
          )}
        </div>
        <div className="flex items-center gap-2.5 mt-0.5">
          <span className="text-xs text-muted-foreground">{item.quantity} {item.unit}</span>
          <span className="text-xs text-muted-foreground/50">&middot;</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ZoneIcon className="size-3" />
            {t(zoneLabelKey[item.zoneType])}
          </span>
          {item.expiryDate && (
            <>
              <span className="text-xs text-muted-foreground/50">&middot;</span>
              <CalendarDays className="size-3 text-muted-foreground/50" />
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {item.expiryDate && (
          <ExpiryBadge status={badgeStatus} date={item.expiryDate} />
        )}
        <StockStatusPill status={item.status} isLowStock={item.isLowStock} />
      </div>
    </div>
  );
}
