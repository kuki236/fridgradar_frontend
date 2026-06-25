import { cn } from "@/lib/utils";

type ExpiryStatus = "safe" | "attention" | "urgent" | "expired";

interface ExpiryBadgeProps {
  status: ExpiryStatus;
  label?: string;
  date?: string;
  className?: string;
}

const statusStyles: Record<ExpiryStatus, string> = {
  safe: "bg-safe-bg text-safe",
  attention: "bg-attention-bg text-attention",
  urgent: "bg-urgent-bg text-urgent",
  expired: "bg-urgent text-urgent-foreground",
};

function formatDateLabel(date: string): string {
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  if (diff < 0) return "Expired";
  if (diff === 0) return "Today";
  if (diff <= 3) return `${diff}d`;
  return `${diff}d`;
}

export function ExpiryBadge({ status, label, date, className }: ExpiryBadgeProps) {
  const displayLabel = label || (date ? formatDateLabel(date) : "");

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", statusStyles[status], className)}>
      {displayLabel}
    </span>
  );
}
