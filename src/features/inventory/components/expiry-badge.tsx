import { cn } from "@/lib/utils";
import { useTranslate } from "@/lib/i18n-context";

export type ExpiryBadgeStatus = "safe" | "attention" | "urgent" | "expired";

interface ExpiryBadgeProps {
  status: ExpiryBadgeStatus;
  label?: string;
  date?: string;
  className?: string;
}

const statusStyles: Record<ExpiryBadgeStatus, string> = {
  safe: "bg-safe-bg text-safe",
  attention: "bg-attention-bg text-attention",
  urgent: "bg-urgent-bg text-urgent",
  expired: "bg-urgent text-urgent-foreground",
};

const statusLabelKey: Record<ExpiryBadgeStatus, string> = {
  safe: "expiry_safe",
  attention: "expiry_attention",
  urgent: "expiry_urgent",
  expired: "expiry_expired",
};

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

export function ExpiryBadge({ status, label, date, className }: ExpiryBadgeProps) {
  const { t } = useTranslate();
  let displayLabel = label;
  if (!displayLabel) {
    if (date) {
      const days = daysUntil(date);
      if (days < 0) displayLabel = t("expiry_expired");
      else if (days === 0) displayLabel = t("expiry_today");
      else displayLabel = `${days}d`;
    } else {
      displayLabel = t(statusLabelKey[status]);
    }
  }
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", statusStyles[status], className)}>
      {displayLabel}
    </span>
  );
}
