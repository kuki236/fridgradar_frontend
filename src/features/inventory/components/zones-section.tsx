"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Loader2, Layers, Snowflake, Refrigerator as FridgeIcon, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslate } from "@/lib/i18n-context";
import { zoneApi, type Zone } from "@/features/inventory/infrastructure/zones.service";
import { refrigeratorApi, type Refrigerator } from "@/features/inventory/infrastructure/refrigerators.service";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";

const ZONE_ICONS = {
  refrigerator: FridgeIcon,
  freezer: Snowflake,
  pantry: Box,
  other: Box,
};

const ZONE_TYPES = ["refrigerator", "freezer", "pantry", "other"] as const;

export function ZonesSection() {
  const { t } = useTranslate();
  const { activeHousehold } = useHouseholdStore();
  const [zones, setZones] = useState<Zone[]>([]);
  const [fridges, setFridges] = useState<Refrigerator[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<(typeof ZONE_TYPES)[number]>("refrigerator");
  const [newFridgeId, setNewFridgeId] = useState("");

  const load = useCallback(() => {
    if (!activeHousehold) return;
    zoneApi.list(activeHousehold.id).then(setZones).catch(() => {});
    refrigeratorApi.list(activeHousehold.id).then(setFridges).catch(() => {});
  }, [activeHousehold]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (open && fridges.length > 0 && !newFridgeId) {
      setNewFridgeId(fridges[0].id);
    }
  }, [open, fridges, newFridgeId]);

  const handleCreate = async () => {
    if (!activeHousehold || !newName.trim()) return;
    setSaving(true);
    try {
      await zoneApi.create({
        household_id: activeHousehold.id,
        name: newName.trim(),
        type: newType,
      });
      setNewName("");
      setOpen(false);
      load();
    } catch {
      // error handled silently
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("settings.confirm_delete_zone"))) return;
    setDeletingId(id);
    try {
      await zoneApi.delete(id);
      load();
    } catch {
      // error handled silently
    }
    setDeletingId(null);
  };

  const fridgeNameById = new Map(fridges.map((f) => [f.id, f.name] as const));

  return (
    <section className="rounded-xl bg-card ring-1 ring-foreground/5 shadow-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Layers className="size-4 text-muted-foreground" />
          {t("settings.zones")}
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm"><Plus className="size-3.5" />{t("settings.add_zone")}</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("settings.add_zone")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="zone-name">{t("settings.zone_name")}</Label>
                <Input
                  id="zone-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t("settings.zone_name")}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("settings.zone_type")}</Label>
                <Select value={newType} onValueChange={(v) => v && setNewType(v as typeof ZONE_TYPES[number])}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("settings.zone_type")}>
                      {(value: string) => t(`type_${value}`)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ZONE_TYPES.map((tp) => (
                      <SelectItem key={tp} value={tp}>{t(`type_${tp}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("settings.zone_fridge")}</Label>
                <Select value={newFridgeId} onValueChange={(v) => v && setNewFridgeId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("settings.zone_fridge")}>
                      {(value: string) => fridges.find((f) => f.id === value)?.name ?? t("settings.zone_fridge")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {fridges.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>{t("inventory.cancel")}</Button>
              <Button onClick={handleCreate} disabled={saving || !newName.trim()}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                {t("inventory.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="divide-y divide-border/50">
        {zones.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            {t("settings.no_zones")}
          </div>
        ) : (
          zones.map((z) => {
            const Icon = ZONE_ICONS[z.type] || Box;
            return (
              <div key={z.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{z.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      <span>{t(`type_${z.type}`)}</span>
                      {z.refrigerator_id && fridgeNameById.has(z.refrigerator_id) && (
                        <> · {fridgeNameById.get(z.refrigerator_id)}</>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(z.id)}
                  disabled={deletingId === z.id}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0 ml-2"
                  title={t("settings.delete_zone")}
                >
                  {deletingId === z.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
