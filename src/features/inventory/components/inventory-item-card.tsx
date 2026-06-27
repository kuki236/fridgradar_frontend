import { Snowflake, Refrigerator, Box, CalendarDays, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExpiryBadge } from "@/features/inventory/components/expiry-badge";
import { StockStatusPill } from "@/features/inventory/components/stock-status-pill";

type InventoryItem = {
  id: string;
  productName: string;
  category?: string;
  imageUrl?: string;
  quantity: number;
  unit?: string;
  expiryDate?: string;
  zoneType: "refrigerator" | "freezer" | "pantry" | "other";
  status: "active" | "consumed" | "discarded" | "low";
};

const zoneIcons = {
  refrigerator: Refrigerator,
  freezer: Snowflake,
  pantry: Box,
  other: Box,
};

const zoneLabels: Record<string, string> = {
  refrigerator: "Fridge",
  freezer: "Freezer",
  pantry: "Pantry",
  other: "Other",
};

const urgencyStyles: Record<string, string> = {
  expired: "bg-urgent-bg/30 ring-urgent/40 hover:ring-urgent/60",
  urgent: "bg-urgent-bg/15 ring-urgent/30 hover:ring-urgent/50",
  attention: "bg-attention-bg/15 ring-attention/30 hover:ring-attention/50",
  safe: "bg-card ring-foreground/5 hover:ring-primary/20",
};

function getExpiryStatus(expiryDate?: string): { status: "safe" | "attention" | "urgent" | "expired"; label: string } {
  if (!expiryDate) return { status: "safe", label: "No expiry" };
  const now = new Date();
  const exp = new Date(expiryDate);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return { status: "expired", label: "Expired" };
  if (diffDays === 0) return { status: "urgent", label: "Today" };
  if (diffDays <= 3) return { status: "urgent", label: `${diffDays}d` };
  if (diffDays <= 7) return { status: "attention", label: `${diffDays}d` };
  return { status: "safe", label: `${diffDays}d` };
}

interface InventoryItemCardProps {
  item: InventoryItem;
  className?: string;
}

export function InventoryItemCard({ item, className }: InventoryItemCardProps) {
  const expiryInfo = getExpiryStatus(item.expiryDate);
  const ZoneIcon = zoneIcons[item.zoneType];
  const ringClass = urgencyStyles[expiryInfo.status] ?? urgencyStyles.safe;

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-xl ring-1 shadow-card hover:shadow-card-hover transition-all", ringClass, className)}>
      <div className="size-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <ZoneIcon className="size-4.5 text-primary" />
        )}
      </div>
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
            {zoneLabels[item.zoneType] || item.zoneType}
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
        {expiryInfo.label !== "No expiry" && (
          <ExpiryBadge status={expiryInfo.status} label={expiryInfo.label} />
        )}
        <StockStatusPill status={item.status} />
      </div>
    </div>
  );
}
