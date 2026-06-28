import { cn } from "@/lib/utils";
import { useTranslate } from "@/lib/i18n-context";
import type { InventoryItemStatus } from "@/features/inventory/infrastructure/inventory.service";

export type StockPillStatus = InventoryItemStatus | "low";

interface StockStatusPillProps {
  status: StockPillStatus;
  isLowStock?: boolean;
  className?: string;
}

const styleByStatus: Record<StockPillStatus, string> = {
  active:    "bg-safe-bg text-safe",
  low:       "bg-attention-bg text-attention",
  consumed:  "bg-muted text-muted-foreground",
  discarded: "bg-urgent-bg text-urgent",
  archived:  "bg-muted text-muted-foreground",
};

export function StockStatusPill({ status, isLowStock = false, className }: StockStatusPillProps) {
  const { t } = useTranslate();
  const effective: StockPillStatus =
    isLowStock && status === "active" ? "low" : (status as StockPillStatus);
  const labelKey = `inventory.${effective === "low" ? "status_low" : `status_${status}`}`;
  const style = styleByStatus[effective];
  if (!style) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
        style,
        className,
      )}
    >
      {t(labelKey)}
    </span>
  );
}
