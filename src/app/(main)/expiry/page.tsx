"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CalendarClock, Loader2, ChevronRight } from "lucide-react";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { expiryApi, type ExpiryResponse, type ExpiryItem, type ExpiryTimelineDay } from "@/features/expiry/infrastructure/expiry.service";
import { inventoryApi } from "@/features/inventory/infrastructure/inventory.service";
import { NoHouseholdGuard } from "@/features/household/components/no-household-guard";
import { useTranslate } from "@/lib/i18n-context";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

const BUCKET_KEYS = ["expired", "today", "this_week", "this_month", "later", "no_date"] as const;
type BucketKey = (typeof BUCKET_KEYS)[number];

const BUCKET_STYLES: Record<BucketKey, { ring: string; badge: string; dot: string; labelKey: string }> = {
  expired:    { ring: "ring-urgent/30",  badge: "bg-urgent text-white",                dot: "bg-urgent",   labelKey: "expiry.buckets.expired" },
  today:      { ring: "ring-urgent/30",  badge: "bg-urgent text-white",                dot: "bg-urgent",   labelKey: "expiry.buckets.today" },
  this_week:  { ring: "ring-attention/30", badge: "bg-attention text-white",            dot: "bg-attention",labelKey: "expiry.buckets.this_week" },
  this_month: { ring: "ring-info/30",    badge: "bg-info text-white",                  dot: "bg-info",     labelKey: "expiry.buckets.this_month" },
  later:      { ring: "ring-border",     badge: "bg-muted text-muted-foreground",     dot: "bg-muted-foreground",labelKey: "expiry.buckets.later" },
  no_date:    { ring: "ring-border",     badge: "bg-muted text-muted-foreground",     dot: "bg-muted-foreground",labelKey: "expiry.buckets.no_date" },
};

function fmtDays(item: ExpiryItem, t: (k: string, p?: Record<string, string|number>) => string) {
  if (item.days_left === null) return t("expiry.no_date_label");
  if (item.days_left === 0) return t("expiry.expires_today");
  if (item.days_left < 0) return t("expiry.days_overdue", { n: Math.abs(item.days_left) });
  return t("expiry.days_left", { n: item.days_left });
}

function ExpiryRow({ item, onConsume, onDiscard, busy }: { item: ExpiryItem; onConsume?: (id: string) => void; onDiscard?: (id: string) => void; busy?: boolean }) {
  const { t } = useTranslate();
  return (
    <Link
      href={`/inventory/${item.id}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.product_name}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {item.quantity} {item.unit ?? ""}{item.refrigerator_name ? ` · ${item.refrigerator_name}` : ""}
        </p>
      </div>
      <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
        {fmtDays(item, t)}
      </span>
      {onConsume && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onConsume(item.id); }}
          disabled={busy}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium px-2 py-0.5 rounded bg-safe-bg text-safe hover:bg-safe/20 disabled:opacity-50 shrink-0"
          title={t("expiry.quick_consume")}
        >
          {t("expiry.consume")}
        </button>
      )}
      {onDiscard && item.days_left !== null && item.days_left <= 0 && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDiscard(item.id); }}
          disabled={busy}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium px-2 py-0.5 rounded bg-urgent-bg text-urgent hover:bg-urgent/20 disabled:opacity-50 shrink-0"
          title={t("expiry.quick_discard")}
        >
          {t("expiry.discard")}
        </button>
      )}
      <ChevronRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  );
}

function BucketSection({ k, items, count, onConsume, onDiscard, busy }: { k: BucketKey; items: ExpiryItem[]; count: number; onConsume?: (id: string) => void; onDiscard?: (id: string) => void; busy?: boolean }) {
  const { t } = useTranslate();
  const style = BUCKET_STYLES[k];
  if (count === 0) return null;
  return (
    <section className={cn("rounded-xl bg-card ring-1 shadow-card overflow-hidden", style.ring)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", style.dot)} />
          <h2 className="text-sm font-medium">{t(style.labelKey)}</h2>
        </div>
        <span className={cn("text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5", style.badge)}>
          {count}
        </span>
      </div>
      <div className="divide-y divide-border/50">
        {items.map((it) => (
          <ExpiryRow
            key={it.id}
            item={it}
            onConsume={onConsume}
            onDiscard={onDiscard}
            busy={busy}
          />
        ))}
      </div>
    </section>
  );
}

function MiniCalendar({ days }: { days: ExpiryTimelineDay[] }) {
  const { t } = useTranslate();
  if (!days.length) return null;
  const max = Math.max(1, ...days.map((d) => d.count));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <section className="rounded-xl bg-card ring-1 ring-foreground/5 shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">{t("expiry.range", { days: days.length })}</h2>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {days.map((d) => {
          const isToday = d.date === today;
          const heightPct = Math.round((d.count / max) * 100);
          const date = new Date(d.date + "T00:00:00");
          const weekday = date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3);
          const dayNum = date.getDate();
          return (
            <div
              key={d.date}
              className={cn(
                "flex flex-col items-center justify-end min-w-[2.25rem] h-24 rounded-md px-1.5 py-1.5 text-[10px]",
                isToday ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/40",
              )}
              title={`${d.date}: ${d.count} items`}
            >
              <span className="font-medium text-foreground/80 tabular-nums">{d.count || ""}</span>
              <div className="w-full flex-1 flex items-end my-1">
                <div
                  className={cn(
                    "w-full rounded-sm",
                    d.count === 0 ? "bg-transparent" : isToday ? "bg-primary" : "bg-foreground/40",
                  )}
                  style={{ height: `${Math.max(8, heightPct)}%` }}
                />
              </div>
              <span className="text-muted-foreground uppercase tracking-wider">{weekday}</span>
              <span className={cn("tabular-nums", isToday ? "font-semibold text-primary" : "text-foreground/60")}>{dayNum}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function ExpiryPage() {
  const { t } = useTranslate();
  const { activeHousehold } = useHouseholdStore();
  const [data, setData] = useState<ExpiryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(14);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!activeHousehold) return;
    setLoading(true);
    const start = new Date().toISOString().slice(0, 10);
    const end = new Date(Date.now() + rangeDays * 86400000).toISOString().slice(0, 10);
    expiryApi
      .get(activeHousehold.id, { start, end })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [activeHousehold, rangeDays]);

  useEffect(() => { load(); }, [load]);

  async function handleConsume(itemId: string) {
    setActionLoadingId(itemId);
    const updated = await inventoryApi.consume(itemId, 1).catch(() => null);
    setActionLoadingId(null);
    if (updated) load();
  }
  async function handleDiscard(itemId: string) {
    setActionLoadingId(itemId);
    const updated = await inventoryApi.discard(itemId).catch(() => null);
    setActionLoadingId(null);
    if (updated) load();
  }

  return (
    <NoHouseholdGuard>
      <div className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <PageHeader
            title={t("expiry.title")}
            subtitle={t("expiry.subtitle")}
            actions={
              <div className="hidden sm:flex gap-1 rounded-lg bg-muted p-0.5">
                {[7, 14, 30].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRangeDays(n)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                      rangeDays === n
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {n}d
                  </button>
                ))}
              </div>
            }
          />
          <div className="sm:hidden flex gap-1 rounded-lg bg-muted p-0.5 w-fit">
            {[7, 14, 30].map((n) => (
              <button
                key={n}
                onClick={() => setRangeDays(n)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  rangeDays === n
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {n}d
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : !data ? (
            <div className="text-center py-20 text-sm text-muted-foreground">—</div>
          ) : data.summary.total === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {t("expiry.empty")}
            </div>
          ) : (
            <>
              {data.timeline.length > 0 && <MiniCalendar days={data.timeline} />}

              <div className="space-y-3">
                {BUCKET_KEYS.map((k) => {
                  const items = data.buckets[k];
                  return (
                    <BucketSection
                      key={k}
                      k={k}
                      items={items}
                      count={items.length}
                      onConsume={handleConsume}
                      onDiscard={handleDiscard}
                      busy={actionLoadingId !== null}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </NoHouseholdGuard>
  );
}
