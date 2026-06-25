"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";

export function HouseholdSwitcher() {
  const { households, activeHousehold, loadHouseholds, setActiveHousehold, createHousehold } =
    useHouseholdStore();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHouseholds();
  }, [loadHouseholds]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createHousehold(newName.trim());
    setNewName("");
    setCreating(false);
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-accent transition-colors"
      >
        <span className="max-w-[120px] truncate">
          {activeHousehold?.name || "Select household"}
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-30 w-56 bg-popover border rounded-lg shadow-lg py-1">
          {households.map((h) => (
            <button
              key={h.id}
              onClick={() => {
                setActiveHousehold(h);
                setOpen(false);
              }}
              className={`flex items-center w-full px-3 py-2 text-sm hover:bg-accent transition-colors ${
                h.id === activeHousehold?.id ? "bg-accent font-medium" : ""
              }`}
            >
              {h.name}
            </button>
          ))}

          {creating ? (
            <div className="px-3 py-2 border-t">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Household name"
                className="w-full h-8 rounded border border-input bg-background px-2 text-sm"
              />
              <div className="flex gap-2 mt-1.5">
                <button
                  onClick={handleCreate}
                  className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground"
                >
                  Create
                </button>
                <button
                  onClick={() => setCreating(false)}
                  className="text-xs px-2 py-1 rounded hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors border-t"
            >
              <Plus className="size-3.5" />
              New household
            </button>
          )}
        </div>
      )}
    </div>
  );
}
