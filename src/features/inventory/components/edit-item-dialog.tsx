"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { inventoryApi, type InventoryItem } from "@/features/inventory/infrastructure/inventory.service";
import { zoneApi, type Zone } from "@/features/inventory/infrastructure/zones.service";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { useTranslate } from "@/lib/i18n-context";

interface EditItemDialogProps {
  item: InventoryItem;
  onUpdated: (item: InventoryItem) => void;
}

const UNITS = ["kg", "g", "lt", "ml", "units", "tbsp", "tsp", "cup", "oz", "lb"];

export function EditItemDialog({ item, onUpdated }: EditItemDialogProps) {
  const { t } = useTranslate();
  const { activeHousehold } = useHouseholdStore();
  const [open, setOpen] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [saving, setSaving] = useState(false);

  const [zoneId, setZoneId] = useState(item.zone_id);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unit, setUnit] = useState(item.unit ?? "");
  const [expiryDate, setExpiryDate] = useState(item.expiry_date ?? "");
  const [lowStockThreshold, setLowStockThreshold] = useState(
    item.low_stock_threshold != null ? String(item.low_stock_threshold) : ""
  );

  useEffect(() => {
    if (open && activeHousehold) {
      zoneApi.list(activeHousehold.id).then(setZones).catch(() => {});
    }
  }, [open, activeHousehold]);

  useEffect(() => {
    if (open) {
      setZoneId(item.zone_id);
      setQuantity(String(item.quantity));
      setUnit(item.unit ?? "");
      setExpiryDate(item.expiry_date ?? "");
      setLowStockThreshold(item.low_stock_threshold != null ? String(item.low_stock_threshold) : "");
    }
  }, [open, item]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const qty = Number(quantity);
      const thresholdNum = Number(lowStockThreshold);
      const updated = await inventoryApi.update(item.id, {
        zone_id: zoneId || item.zone_id,
        quantity: Number.isFinite(qty) && qty > 0 ? qty : item.quantity,
        unit: unit || null,
        expiry_date: expiryDate || null,
        low_stock_threshold: Number.isFinite(thresholdNum) && thresholdNum > 0 ? thresholdNum : null,
      });
      onUpdated(updated);
      setOpen(false);
    } catch {
      // error handled silently
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm">
          <Pencil className="size-3.5" />
          {t("inventory.edit_item")}
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("inventory.edit_item_title", { name: item.product_name })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("inventory.zone")}</Label>
            <Select value={zoneId} onValueChange={(v) => v && setZoneId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {zones.map((z) => (
                  <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-qty">{t("inventory.quantity")}</Label>
              <Input
                id="edit-qty"
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-unit">{t("inventory.unit")}</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("inventory.unit")} />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{t(`inventory.unit_${u}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-expiry">{t("inventory.expiry_date")}</Label>
              <Input
                id="edit-expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-threshold">{t("inventory.low_stock_threshold")}</Label>
              <Input
                id="edit-threshold"
                type="number"
                min="0"
                step="0.01"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="1.0"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>{t("inventory.cancel")}</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {t("inventory.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
