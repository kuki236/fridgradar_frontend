"use client";

import { useEffect, useState } from "react";
import { History, Loader2 } from "lucide-react";
import { activityApi, type ActivityEntry } from "@/features/activity/infrastructure/activity.service";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { NoHouseholdGuard } from "@/features/household/components/no-household-guard";
import { useTranslate } from "@/lib/i18n-context";
import { PageHeader } from "@/components/layout/page-header";

const actionLabels: Record<string, string> = {
  created: "added",
  updated: "updated",
  consumed: "consumed",
  discarded: "discarded",
  restocked: "restocked",
  deleted: "removed",
};

export default function ActivityPage() {
  const { t } = useTranslate();
  const { activeHousehold } = useHouseholdStore();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeHousehold) return;
    setLoading(true);
    activityApi.list(activeHousehold.id).then(setEntries).catch(() => {}).finally(() => setLoading(false));
  }, [activeHousehold]);

  return (
    <NoHouseholdGuard>
    <div className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <PageHeader title={t("activity.title")} />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="size-9 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-1/4 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <History className="size-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium">{t("activity.no_activity")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("activity.no_activity_desc")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="flex gap-3 p-3 rounded-xl bg-card ring-1 ring-foreground/5 shadow-card">
                <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-primary">
                    {entry.actor_name
                      ? entry.actor_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      : "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{entry.actor_name || t("activity.someone")}</span>{" "}
                    {actionLabels[entry.action] || entry.action}{" "}
                    <span className="font-medium capitalize">{entry.entity_type.replace("_", " ")}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(entry.created_at).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </NoHouseholdGuard>
  );
}
