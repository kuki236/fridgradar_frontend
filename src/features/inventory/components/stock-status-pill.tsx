import { cn } from "@/lib/utils";

type StockStatus = "active" | "consumed" | "discarded" | "low";

interface StockStatusPillProps {
  status: StockStatus;
  className?: string;
}

const statusConfig: Record<StockStatus, { label: string; style: string }> = {
  active: { label: "In Stock", style: "bg-safe-bg text-safe" },
  low: { label: "Low Stock", style: "bg-attention-bg text-attention" },
  consumed: { label: "Consumed", style: "bg-muted text-muted-foreground" },
  discarded: { label: "Discarded", style: "bg-urgent-bg text-urgent" },
};

export function StockStatusPill({ status, className }: StockStatusPillProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
        config.style,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
