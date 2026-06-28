"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inventoryApi } from "@/features/inventory/infrastructure/inventory.service";
import { zoneApi, type Zone } from "@/features/inventory/infrastructure/zones.service";
import { refrigeratorApi, type Refrigerator } from "@/features/inventory/infrastructure/refrigerators.service";
import { searchLocalProducts, type LocalProduct } from "@/features/inventory/lib/local-products";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { useTranslate } from "@/lib/i18n-context";
import { CategoryIcon } from "@/features/inventory/components/category-icon";

interface AddItemDialogProps {
  onAdded: () => void;
}

const CATEGORIES = [
  "Lácteos", "Carne", "Aves", "Pescado", "Verduras", "Frutas", "Granos",
  "Pasta", "Pan", "Condimentos", "Aceites", "Salsas", "Especias", "Hierbas",
  "Bebidas", "Botanas", "Congelados", "Enlatados", "Panadería",
  "Alternativas Lácteas", "Comidas Preparadas", "Bebé", "Mascotas", "Otros",
];

const UNITS = ["kg", "g", "lt", "ml", "units", "tbsp", "tsp", "cup", "oz", "lb"];

export function AddItemDialog({ onAdded }: AddItemDialogProps) {
  const { t } = useTranslate();
  const { activeHousehold } = useHouseholdStore();
  const [open, setOpen] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [fridges, setFridges] = useState<Refrigerator[]>([]);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<LocalProduct[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LocalProduct | null>(null);

  const [category, setCategory] = useState("Other");
  const [zoneId, setZoneId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("");

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open && activeHousehold) {
      Promise.all([
        zoneApi.list(activeHousehold.id),
        refrigeratorApi.list(activeHousehold.id),
      ])
        .then(([zs, fs]) => {
          setZones(zs);
          setFridges(fs);
          if (!zoneId && zs.length > 0) setZoneId(zs[0].id);
        })
        .catch(() => {});
    }
  }, [open, activeHousehold]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Local catalog search (replaces the old Open Food Facts call). Instant,
  // offline, and the catalog is bundled with the app.
  useEffect(() => {
    if (!searchTerm.trim() || selectedProduct) {
      setResults([]);
      return;
    }
    setResults(searchLocalProducts(searchTerm));
  }, [searchTerm, selectedProduct]);

  useEffect(() => {
    setShowDropdown(searchTerm.trim().length > 0 && !selectedProduct);
  }, [searchTerm, selectedProduct]);

  function handleSelectProduct(product: LocalProduct) {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setCategory(product.category || "Other");
    setUnit(product.unit || "");
    setShowDropdown(false);
  }

  function handleClearSelection() {
    setSelectedProduct(null);
    setSearchTerm("");
    setCategory("Other");
    setUnit("");
    setResults([]);
    inputRef.current?.focus();
  }

  function reset() {
    setOpen(false);
    setSearchTerm("");
    setQuantity("1");
    setUnit("");
    setExpiryDate("");
    setSelectedProduct(null);
    setResults([]);
    setLowStockThreshold("");
  }

  const handleSubmit = async () => {
    if (!activeHousehold || !searchTerm.trim() || !zoneId) return;
    setSaving(true);
    try {
      const thresholdNum = Number(lowStockThreshold);
      await inventoryApi.create({
        household_id: activeHousehold.id,
        product_name: searchTerm.trim(),
        product_category: category,
        zone_id: zoneId,
        quantity: Number(quantity) || 1,
        unit: unit || undefined,
        expiry_date: expiryDate || undefined,
        low_stock_threshold: Number.isFinite(thresholdNum) && thresholdNum > 0 ? thresholdNum : undefined,
      });
      reset();
      onAdded();
    } catch {
      // error handled silently
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : reset())}>
      <DialogTrigger render={<Button variant="default"><Plus className="size-4" />{t("inventory.add_item")}</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("inventory.add_item")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="product-search">{t("inventory.name")}</Label>
            <div className="relative" ref={dropdownRef}>
              <div className="flex gap-3 items-start">
                <div className="flex-1 relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    ref={inputRef}
                    id="product-search"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (selectedProduct) handleClearSelection();
                    }}
                    placeholder={t("inventory.search_products")}
                    className="pl-8"
                    autoFocus
                    autoComplete="off"
                  />
                </div>
                <div className="size-14 shrink-0 rounded-lg border flex items-center justify-center overflow-hidden">
                  <CategoryIcon category={category} size="lg" />
                </div>
              </div>
              {showDropdown && (
                <div className="absolute top-full mt-1 left-0 right-14 z-30 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {results.length > 0 ? (
                    results.map((product) => (
                      <button
                        key={product.name}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                      >
                        <div className="shrink-0">
                          <CategoryIcon category={product.category} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(null);
                        setCategory("Other");
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
                    >
                      <Plus className="size-3.5" />
                      {t("inventory.custom_product", { name: searchTerm })}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("inventory.category")}</Label>
              <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("inventory.zone")}</Label>
              <Select value={zoneId} onValueChange={(v) => v && setZoneId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("inventory.zone")}>
                    {(value: string) => zones.find((zone) => zone.id === value)?.name ?? t("inventory.zone")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {zones.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {t("inventory.no_zones")}
                    </div>
                  )}
                  {zones.map((z) => {
                    const f = fridges.find((fr) => fr.id === z.refrigerator_id);
                    return (
                      <SelectItem key={z.id} value={z.id}>
                        <span className="flex flex-col">
                          <span>{z.name}</span>
                          {f && (
                            <span className="text-[10px] text-muted-foreground">
                              {f.name}
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qty">{t("inventory.quantity")}</Label>
              <Input
                id="qty"
                type="number"
                min="0"
                step="0.5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">{t("inventory.unit")}</Label>
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
              <Label htmlFor="expiry">{t("inventory.expiry_date")}</Label>
              <Input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="threshold">{t("inventory.low_stock_threshold")}</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                step="0.5"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="1.0"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={reset}>{t("inventory.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={saving || !searchTerm.trim() || !zoneId}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {t("inventory.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
