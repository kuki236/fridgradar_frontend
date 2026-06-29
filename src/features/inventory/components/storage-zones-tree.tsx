"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Trash2, Loader2, Refrigerator as FridgeIcon, Box, Snowflake, ChevronDown, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslate } from "@/lib/i18n-context";
import { zoneApi, type Zone } from "@/features/inventory/infrastructure/zones.service";
import { refrigeratorApi, type Refrigerator } from "@/features/inventory/infrastructure/refrigerators.service";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { cn } from "@/lib/utils";

const ZONE_ICONS: Record<string, typeof FridgeIcon> = {
  refrigerator: FridgeIcon,
  freezer: Snowflake,
  pantry: Box,
  other: Box,
};

type ZoneType = "refrigerator" | "freezer" | "pantry" | "other";
type FridgeType = "refrigerator" | "freezer" | "pantry" | "other";

const ZONE_TYPES: readonly ZoneType[] = ["refrigerator", "freezer", "pantry", "other"] as const;

/**
 * Storage + Zones, rendered as a nested accordion (RF-INV-001, RF-INV-002).
 *
 * The previous Settings layout put storage and zones in two completely
 * separate cards. Users couldn't tell which zones belonged to which
 * refrigerator; the only hint was a small "Type · Refrigerator · Refrigerador"
 * line under each zone. The audit explicitly called this out as confusing.
 *
 * This component shows each storage unit as a row. Clicking it expands an
 * inline panel with the zones inside it and a "+ Zone" button to add more.
 * The whole storage row also has a destructive trash button, gated by a
 * proper confirmation dialog (RF-INV-001).
 */
export function StorageZonesTree() {
  const { t } = useTranslate();
  const { activeHousehold } = useHouseholdStore();
  const [fridges, setFridges] = useState<Refrigerator[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Fridge dialog state
  const [fridgeDialogOpen, setFridgeDialogOpen] = useState(false);
  const [savingFridge, setSavingFridge] = useState(false);
  const [newFridgeName, setNewFridgeName] = useState("");
  const [newFridgeType, setNewFridgeType] = useState("refrigerator");

  // Zone dialog state (per-fridge)
  const [zoneDialogFridgeId, setZoneDialogFridgeId] = useState<string | null>(null);
  const [savingZone, setSavingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneType, setNewZoneType] = useState<(typeof ZONE_TYPES)[number]>("refrigerator");

  // Delete confirmation state
  const [fridgeToDelete, setFridgeToDelete] = useState<Refrigerator | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);

  const load = useCallback(() => {
    if (!activeHousehold) return;
    refrigeratorApi.list(activeHousehold.id).then(setFridges).catch(() => {});
    zoneApi.list(activeHousehold.id).then(setZones).catch(() => {});
  }, [activeHousehold]);

  useEffect(() => { load(); }, [load]);

  // Group zones by refrigerator_id so the tree is O(1) to render.
  const zonesByFridge = useMemo(() => {
    const map = new Map<string, Zone[]>();
    for (const z of zones) {
      if (!z.refrigerator_id) continue;
      const arr = map.get(z.refrigerator_id) ?? [];
      arr.push(z);
      map.set(z.refrigerator_id, arr);
    }
    return map;
  }, [zones]);

  const unassignedZones = useMemo(
    () => zones.filter((z) => !z.refrigerator_id),
    [zones],
  );

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fridgeIcons: Record<string, typeof FridgeIcon> = {
    refrigerator: FridgeIcon,
    freezer: Snowflake,
    pantry: Box,
    other: Box,
  };

  const handleAddFridge = async () => {
    if (!activeHousehold || !newFridgeName.trim()) return;
    setSavingFridge(true);
    try {
      await refrigeratorApi.create({
        household_id: activeHousehold.id,
        name: newFridgeName.trim(),
        type: newFridgeType,
      });
      setFridgeDialogOpen(false);
      setNewFridgeName("");
      setNewFridgeType("refrigerator");
      load();
    } catch {
      // error handled silently
    }
    setSavingFridge(false);
  };

  const handleConfirmDeleteFridge = async () => {
    if (!fridgeToDelete) return;
    await refrigeratorApi.delete(fridgeToDelete.id);
    setFridges((prev) => prev.filter((f) => f.id !== fridgeToDelete.id));
    // Remove dangling zones for this fridge locally.
    setZones((prev) => prev.filter((z) => z.refrigerator_id !== fridgeToDelete.id));
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(fridgeToDelete.id);
      return next;
    });
    setFridgeToDelete(null);
  };

  const handleAddZone = async () => {
    if (!activeHousehold || !zoneDialogFridgeId || !newZoneName.trim()) return;
    setSavingZone(true);
    try {
      await zoneApi.create({
        household_id: activeHousehold.id,
        name: newZoneName.trim(),
        type: newZoneType,
        refrigerator_id: zoneDialogFridgeId,
      });
      // Auto-expand the parent so the user sees the zone they just added.
      setExpanded((prev) => new Set(prev).add(zoneDialogFridgeId));
      load();
      setZoneDialogFridgeId(null);
      setNewZoneName("");
      setNewZoneType("refrigerator");
    } catch {
      // error handled silently
    }
    setSavingZone(false);
  };

  const handleConfirmDeleteZone = async () => {
    if (!zoneToDelete) return;
    await zoneApi.delete(zoneToDelete.id);
    setZones((prev) => prev.filter((z) => z.id !== zoneToDelete.id));
    setZoneToDelete(null);
  };

  return (
    <section className="rounded-xl bg-card ring-1 ring-foreground/5 shadow-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <FridgeIcon className="size-4 text-muted-foreground" />
          {t("settings.storage")}
        </h2>
        <Dialog open={fridgeDialogOpen} onOpenChange={setFridgeDialogOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm"><Plus className="size-3.5" />{t("settings.add_fridge")}</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("settings.add_fridge")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fridge-name">{t("settings.fridge_name")}</Label>
                <Input
                  id="fridge-name"
                  value={newFridgeName}
                  onChange={(e) => setNewFridgeName(e.target.value)}
                  placeholder={t("settings.fridge_name")}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("settings.fridge_type")}</Label>
                <Select value={newFridgeType} onValueChange={(v) => v && setNewFridgeType(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("settings.fridge_type")}>
                      {(value: string) => t(`type_${value}` as `type_${FridgeType}`)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refrigerator">{t("type_refrigerator")}</SelectItem>
                    <SelectItem value="freezer">{t("type_freezer")}</SelectItem>
                    <SelectItem value="pantry">{t("type_pantry")}</SelectItem>
                    <SelectItem value="other">{t("type_other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setFridgeDialogOpen(false)}>
                {t("settings.cancel")}
              </Button>
              <Button onClick={handleAddFridge} disabled={savingFridge || !newFridgeName.trim()}>
                {savingFridge && <Loader2 className="size-4 animate-spin" />}
                {t("settings.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {fridges.length === 0 && unassignedZones.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          {t("settings.storage")}...
        </div>
      ) : (
        <ul className="divide-y divide-border/50">
          {fridges.map((fridge) => {
            const Icon = fridgeIcons[fridge.type] || Box;
            const isOpen = expanded.has(fridge.id);
            const childZones = zonesByFridge.get(fridge.id) ?? [];
            return (
              <li key={fridge.id}>
                <div
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors",
                    isOpen ? "bg-muted/30" : "hover:bg-muted/30",
                  )}
                  onClick={() => toggle(fridge.id)}
                  role="button"
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? t("settings.collapse") : t("settings.expand")} ${fridge.name}`}
                >
                  <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{fridge.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(`type_${fridge.type}` as `type_${FridgeType}`)} · {childZones.length} {childZones.length === 1 ? "zona" : "zonas"}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform shrink-0",
                      isOpen && "rotate-180",
                    )}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFridgeToDelete(fridge);
                    }}
                    className="text-muted-foreground hover:text-urgent transition-colors p-1.5 rounded-md hover:bg-urgent-bg/40"
                    title={t("settings.delete_fridge")}
                    aria-label={t("settings.delete_fridge")}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                {isOpen && (
                  <div className="bg-muted/20 border-t border-border/50">
                    <ul className="divide-y divide-border/30">
                      {childZones.length === 0 ? (
                        <li className="px-12 py-3 text-xs text-muted-foreground italic">
                          {t("settings.no_zones")}
                        </li>
                      ) : (
                        childZones.map((z) => {
                          const ZoneIcon = ZONE_ICONS[z.type] || Box;
                          return (
                            <li
                              key={z.id}
                              className="group/zone flex items-center gap-3 px-4 py-2.5 pl-12 hover:bg-muted/40 transition-colors"
                            >
                              <Layers className="size-3 text-muted-foreground shrink-0" />
                              <div className="size-6 rounded-md bg-background ring-1 ring-foreground/5 flex items-center justify-center shrink-0">
                                <ZoneIcon className="size-3 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm truncate">{z.name}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {t(`type_${z.type}` as `type_${ZoneType}`)}
                                </p>
                              </div>
                              <button
                                onClick={() => setZoneToDelete(z)}
                                className="text-muted-foreground hover:text-urgent transition-colors p-1 rounded-md opacity-0 group-hover/zone:opacity-100"
                                title={t("settings.delete_zone")}
                                aria-label={t("settings.delete_zone")}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>
                    <div className="px-4 py-2 pl-12 border-t border-border/30">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setZoneDialogFridgeId(fridge.id);
                          setNewZoneType(fridge.type);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="size-3" />
                        {t("settings.add_zone")}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}

          {unassignedZones.length > 0 && (
            <li>
              <div className="px-4 py-3 bg-muted/20">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {t("settings.zone_no_storage")}
                </p>
                <ul className="divide-y divide-border/30">
                  {unassignedZones.map((z) => {
                    const ZoneIcon = ZONE_ICONS[z.type] || Box;
                    return (
                      <li
                        key={z.id}
                        className="group/zone flex items-center gap-3 py-2.5"
                      >
                        <Layers className="size-3 text-muted-foreground shrink-0" />
                        <div className="size-6 rounded-md bg-background ring-1 ring-foreground/5 flex items-center justify-center shrink-0">
                          <ZoneIcon className="size-3 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{z.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {t(`type_${z.type}` as `type_${ZoneType}`)}
                          </p>
                        </div>
                        <button
                          onClick={() => setZoneToDelete(z)}
                          className="text-muted-foreground hover:text-urgent transition-colors p-1 rounded-md opacity-0 group-hover/zone:opacity-100"
                          title={t("settings.delete_zone")}
                          aria-label={t("settings.delete_zone")}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          )}
        </ul>
      )}

      {/* Add Zone dialog (per fridge) */}
      <Dialog
        open={zoneDialogFridgeId !== null}
        onOpenChange={(o) => {
          if (!o) {
            setZoneDialogFridgeId(null);
            setNewZoneName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.add_zone")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="zone-name">{t("settings.zone_name")}</Label>
              <Input
                id="zone-name"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder={t("settings.zone_name")}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("settings.zone_type")}</Label>
              <Select
                value={newZoneType}
                onValueChange={(v) => v && setNewZoneType(v as typeof ZONE_TYPES[number])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("settings.zone_type")}>
                    {(value: string) => t(`type_${value}` as `type_${ZoneType}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ZONE_TYPES.map((tp) => (
                    <SelectItem key={tp} value={tp}>{t(`type_${tp}` as `type_${ZoneType}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setZoneDialogFridgeId(null)}>
              {t("settings.cancel")}
            </Button>
            <Button onClick={handleAddZone} disabled={savingZone || !newZoneName.trim()}>
              {savingZone && <Loader2 className="size-4 animate-spin" />}
              {t("settings.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm delete fridge */}
      <ConfirmDialog
        open={fridgeToDelete !== null}
        onOpenChange={(o) => { if (!o) setFridgeToDelete(null); }}
        title={t("settings.confirm_delete_fridge_title")}
        description={t("settings.confirm_delete_fridge_desc")}
        confirmLabel={t("settings.delete_fridge")}
        onConfirm={handleConfirmDeleteFridge}
      />

      {/* Confirm delete zone */}
      <ConfirmDialog
        open={zoneToDelete !== null}
        onOpenChange={(o) => { if (!o) setZoneToDelete(null); }}
        title={t("settings.confirm_delete_zone_title")}
        description={t("settings.confirm_delete_zone_desc")}
        confirmLabel={t("settings.delete_zone")}
        onConfirm={handleConfirmDeleteZone}
      />
    </section>
  );
}
