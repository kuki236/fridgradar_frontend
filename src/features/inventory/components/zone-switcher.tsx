"use client";

import { useState } from "react";
import { Snowflake, Refrigerator, Box, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/lib/i18n-context";

type Zone = {
  id: string;
  name: string;
  type: "refrigerator" | "freezer" | "pantry" | "other";
};

const zoneIcons = {
  refrigerator: Refrigerator,
  freezer: Snowflake,
  pantry: Box,
  other: Box,
};

interface ZoneSwitcherProps {
  zones: Zone[];
  activeZoneId?: string;
  onZoneChange: (zoneId: string) => void;
  className?: string;
}

export function ZoneSwitcher({
  zones,
  activeZoneId,
  onZoneChange,
  className,
}: ZoneSwitcherProps) {
  const { t } = useTranslate();
  const [open, setOpen] = useState(false);
  const activeZone = zones.find((z) => z.id === activeZoneId);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-md border bg-background text-sm font-medium hover:bg-accent transition-colors w-full"
      >
        {activeZone ? (
          <>
            {(() => {
              const Icon = zoneIcons[activeZone.type];
              return <Icon className="size-4 text-muted-foreground" />;
            })()}
            <span className="flex-1 text-left">{activeZone.name}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-muted-foreground">
            {t("inventory.all_zones")}
          </span>
        )}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-popover border rounded-md shadow-lg py-1">
            <button
              onClick={() => {
                onZoneChange("");
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              {t("inventory.all_zones")}
            </button>
            {zones.map((zone) => {
              const Icon = zoneIcons[zone.type];
              return (
                <button
                  key={zone.id}
                  onClick={() => {
                    onZoneChange(zone.id);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors ${
                    zone.id === activeZoneId
                      ? "bg-accent font-medium"
                      : ""
                  }`}
                >
                  <Icon className="size-4 text-muted-foreground" />
                  {zone.name}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
