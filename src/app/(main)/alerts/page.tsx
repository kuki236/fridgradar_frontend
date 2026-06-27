"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Eye, Clock, BellOff, Loader2, Zap, Snowflake, Calendar, Package } from "lucide-react";
import { alertApi, type Alert } from "@/features/alerts/infrastructure/alerts.service";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { NoHouseholdGuard } from "@/features/household/components/no-household-guard";
import { useTranslate } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const severityConfig: Record<string, { border: string; bg: string; dot: string; badge: string }> = {
  critical: { border: "border-l-urgent", bg: "bg-urgent-bg/15", dot: "bg-urgent", badge: "bg-urgent text-white" },
  warning: { border: "border-l-attention", bg: "bg-attention-bg/15", dot: "bg-attention", badge: "bg-attention text-white" },
  info: { border: "border-l-info", bg: "bg-info-bg/15", dot: "bg-info", badge: "bg-info text-white" },
};

const typeIcons: Record<string, typeof Bell> = {
  expired: Bell,
  expiring_today: Bell,
  expiring_soon: Calendar,
  low_stock: Package,
};

function severityCount(alerts: Alert[], severity: string) {
  return alerts.filter((a) => a.severity === severity).length;
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export default function AlertsPage() {
  const { t } = useTranslate();
  const { activeHousehold } = useHouseholdStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [snoozingId, setSnoozingId] = useState<string | null>(null);

  const loadAlerts = useCallback(() => {
    if (!activeHousehold) return;
    setLoading(true);
    alertApi.list(activeHousehold.id, filter || undefined).then(setAlerts).catch(() => {}).finally(() => setLoading(false));
  }, [activeHousehold, filter]);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  const handleMarkRead = async (id: string) => {
    await alertApi.markRead(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSnooze = async (id: string, hours: number) => {
    setSnoozingId(id);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/alerts/${id}/snooze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify({ duration_hours: hours }),
      });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // error handled silently
    }
    setSnoozingId(null);
  };

  const handleScan = async () => {
    if (!activeHousehold) return;
    setScanning(true);
    setScanMsg(null);
    try {
      const res = await alertApi.runPreview(activeHousehold.id);
      setScanMsg(t("alerts.scan_result", { n: res.created }));
      loadAlerts();
    } catch {
      // error handled silently
    }
    setScanning(false);
  };

  const filters = [
    { value: "", label: t("alerts.all") },
    { value: "critical", label: `${t("alerts.critical")} (${severityCount(alerts, "critical")})` },
    { value: "warning", label: `${t("alerts.warning")} (${severityCount(alerts, "warning")})` },
    { value: "info", label: `${t("alerts.info")} (${severityCount(alerts, "info")})` },
  ];

  return (
    <NoHouseholdGuard>
    <div className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{t("alerts.title")}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleScan}
            disabled={scanning}
            title={t("alerts.scan_now")}
          >
            {scanning ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Zap className="size-3.5" />
            )}
            {scanning ? t("alerts.scanning") : t("alerts.scan_now")}
          </Button>
        </div>

        {scanMsg && (
          <div className="text-xs text-muted-foreground bg-card ring-1 ring-foreground/5 rounded-lg px-3 py-2">
            {scanMsg}
          </div>
        )}

        <div className="flex gap-1.5 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground ring-1 ring-foreground/5 hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-20">
            <BellOff className="size-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium">{t("alerts.all_clear")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("alerts.no_alerts")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const cfg = severityConfig[alert.severity] || severityConfig.info;
              const TypeIcon = typeIcons[alert.type] || Bell;
              const due = daysUntil(alert.due_at);
              return (
                <div key={alert.id} className={cn("rounded-xl border-l-4 bg-card p-4 shadow-card hover:shadow-card-hover transition-shadow", cfg.border, cfg.bg)}>
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-background/60 ring-1 ring-foreground/10 flex items-center justify-center shrink-0">
                      <TypeIcon className="size-4 text-foreground/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <span className={cn("text-[10px] font-semibold uppercase tracking-wider rounded-full px-1.5 py-0.5", cfg.badge)}>
                          {alert.severity}
                        </span>
                        {alert.type && (
                          <span className="text-[10px] font-medium uppercase tracking-wider rounded-full px-1.5 py-0.5 bg-muted text-muted-foreground">
                            {t(`alerts.types.${alert.type}` as any) || alert.type}
                          </span>
                        )}
                      </div>
                      {alert.message && <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>}
                      {alert.product_name && <p className="text-xs text-muted-foreground/70 mt-0.5">{alert.product_name}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        {due !== null && (
                          <span className="text-[10px] tabular-nums text-muted-foreground">
                            {due === 0 ? t("alerts.due", { date: new Date(alert.due_at!).toLocaleDateString() }) : due < 0 ? `${-due}d overdue` : `${due}d`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <div className="flex gap-1">
                        <button onClick={() => handleMarkRead(alert.id)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title={t("alerts.dismiss")}>
                          <Eye className="size-3.5" />
                        </button>
                      </div>
                      <div className="relative group/snooze">
                        <button
                          onClick={() => handleSnooze(alert.id, 24)}
                          disabled={snoozingId === alert.id}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                          title={t("alerts.snooze")}
                        >
                          {snoozingId === alert.id ? <Loader2 className="size-3.5 animate-spin" /> : <Clock className="size-3.5" />}
                        </button>
                        <div className="absolute right-0 top-full mt-1 z-20 hidden group-hover/snooze:flex group-focus-within/snooze:flex flex-col bg-popover ring-1 ring-foreground/10 rounded-lg shadow-lg py-1 min-w-[8rem]">
                          {[24, 72, 168].map((hours) => (
                            <button
                              key={hours}
                              type="button"
                              onClick={() => handleSnooze(alert.id, hours)}
                              className="px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors"
                            >
                              {hours === 24 ? t("alerts.snooze_24h") : hours === 72 ? t("alerts.snooze_3d") : t("alerts.snooze_1w")}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </NoHouseholdGuard>
  );
}
