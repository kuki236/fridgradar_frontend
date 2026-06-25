"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Eye, Clock, BellOff, Loader2 } from "lucide-react";
import { alertApi, type Alert } from "@/features/alerts/infrastructure/alerts.service";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { NoHouseholdGuard } from "@/features/household/components/no-household-guard";
import { useTranslate } from "@/lib/i18n-context";

const severityConfig: Record<string, { border: string; bg: string; dot: string }> = {
  critical: { border: "border-l-urgent", bg: "bg-urgent-bg/15", dot: "bg-urgent" },
  warning: { border: "border-l-attention", bg: "bg-attention-bg/15", dot: "bg-attention" },
  info: { border: "border-l-info", bg: "bg-info-bg/15", dot: "bg-info" },
};

function severityCount(alerts: Alert[], severity: string) {
  return alerts.filter((a) => a.severity === severity).length;
}

export default function AlertsPage() {
  const { t } = useTranslate();
  const { activeHousehold } = useHouseholdStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

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

  const handleSnooze = async (id: string) => {
    await alertApi.snooze(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
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
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">{t("alerts.title")}</h1>
          {alerts.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {severityCount(alerts, "critical")} {t("alerts.urgent")}
            </span>
          )}
        </div>

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
              return (
                <div key={alert.id} className={`rounded-xl border-l-4 bg-card p-4 shadow-card hover:shadow-card-hover transition-shadow ${cfg.border} ${cfg.bg}`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 size-2 rounded-full shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.title}</p>
                      {alert.message && <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>}
                      {alert.product_name && <p className="text-xs text-muted-foreground/70 mt-0.5">{alert.product_name}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] uppercase font-medium text-muted-foreground/60">{alert.severity}</span>
                        {alert.due_at && (
                          <span className="text-[10px] text-muted-foreground/60">
                            {t("alerts.due", { date: new Date(alert.due_at).toLocaleDateString() })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleMarkRead(alert.id)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title={t("alerts.dismiss")}>
                        <Eye className="size-3.5" />
                      </button>
                      <button onClick={() => handleSnooze(alert.id)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title={t("alerts.snooze")}>
                        <Clock className="size-3.5" />
                      </button>
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
