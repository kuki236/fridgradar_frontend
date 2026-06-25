"use client";

import { useState } from "react";
import { Snowflake, Refrigerator, Box, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/lib/i18n-context";

type Fridge = {
  id: string;
  name: string;
  type: "refrigerator" | "freezer" | "pantry" | "other";
};

const fridgeIcons = {
  refrigerator: Refrigerator,
  freezer: Snowflake,
  pantry: Box,
  other: Box,
};

interface FridgeSwitcherProps {
  fridges: Fridge[];
  activeFridgeId?: string;
  onFridgeChange: (fridgeId: string) => void;
  className?: string;
}

export function FridgeSwitcher({
  fridges,
  activeFridgeId,
  onFridgeChange,
  className,
}: FridgeSwitcherProps) {
  const { t } = useTranslate();
  const [open, setOpen] = useState(false);
  const activeFridge = fridges.find((f) => f.id === activeFridgeId);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-md border bg-background text-sm font-medium hover:bg-accent transition-colors w-full"
      >
        {activeFridge ? (
          <>
            {(() => {
              const Icon = fridgeIcons[activeFridge.type];
              return <Icon className="size-4 text-muted-foreground" />;
            })()}
            <span className="flex-1 text-left">{activeFridge.name}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-muted-foreground">
            {t("inventory.all_fridges")}
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
                onFridgeChange("");
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              {t("inventory.all_fridges")}
            </button>
            {fridges.map((fridge) => {
              const Icon = fridgeIcons[fridge.type];
              return (
                <button
                  key={fridge.id}
                  onClick={() => {
                    onFridgeChange(fridge.id);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors ${
                    fridge.id === activeFridgeId
                      ? "bg-accent font-medium"
                      : ""
                  }`}
                >
                  <Icon className="size-4 text-muted-foreground" />
                  {fridge.name}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
