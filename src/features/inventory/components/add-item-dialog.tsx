"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Loader2, Search, ImageOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inventoryApi } from "@/features/inventory/infrastructure/inventory.service";
import { refrigeratorApi, type Refrigerator } from "@/features/inventory/infrastructure/refrigerators.service";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { useTranslate } from "@/lib/i18n-context";

interface AddItemDialogProps {
  onAdded: () => void;
}

interface ProductResult {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
}

const CATEGORIES = [
  "Dairy", "Meat", "Poultry", "Fish", "Vegetables", "Fruits", "Grains",
  "Pasta", "Bread", "Condiments", "Oils", "Sauces", "Spices", "Herbs",
  "Beverages", "Snacks", "Frozen", "Canned", "Bakery", "Dairy Alternatives",
  "Prepared Foods", "Baby", "Pet", "Other",
];

const UNITS = ["kg", "g", "lt", "ml", "units", "tbsp", "tsp", "cup", "oz", "lb"];

export function AddItemDialog({ onAdded }: AddItemDialogProps) {
  const { t } = useTranslate();
  const { activeHousehold } = useHouseholdStore();
  const [open, setOpen] = useState(false);
  const [fridges, setFridges] = useState<Refrigerator[]>([]);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null);

  const [category, setCategory] = useState("Other");
  const [fridgeId, setFridgeId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open && activeHousehold) {
      refrigeratorApi.list(activeHousehold.id).then((fs) => {
        setFridges(fs);
        if (!fridgeId && fs.length > 0) setFridgeId(fs[0].id);
      }).catch(() => {});
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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchTerm.trim()) {
      setResults([]);
      setSearched(false);
      setSearching(false);
      return;
    }
    setSearched(false);
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchTerm)}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        const products: ProductResult[] = Array.isArray(data) ? data : data.products ?? [];
        setResults(products);
        setSearched(true);
      } catch {
        setResults([]);
        setSearched(true);
      }
      setSearching(false);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  useEffect(() => {
    setShowDropdown(searchTerm.trim().length > 0 && !selectedProduct);
  }, [searchTerm, selectedProduct]);

  function handleSelectProduct(product: ProductResult) {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setCategory(product.category);
    setImageUrl(product.image_url);
    setShowDropdown(false);
  }

  function handleClearSelection() {
    setSelectedProduct(null);
    setSearchTerm("");
    setCategory("Other");
    setImageUrl(null);
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  }

  const handleSubmit = async () => {
    if (!activeHousehold || !searchTerm.trim() || !fridgeId) return;
    setSaving(true);
    try {
      await inventoryApi.create({
        household_id: activeHousehold.id,
        product_name: searchTerm.trim(),
        product_category: category,
        image_url: imageUrl || undefined,
        zone_id: fridgeId,
        quantity: Number(quantity) || 1,
        unit: unit || undefined,
        expiry_date: expiryDate || undefined,
      });
      setOpen(false);
      setSearchTerm("");
      setQuantity("1");
      setUnit("");
      setExpiryDate("");
      setImageUrl(null);
      setSelectedProduct(null);
      setResults([]);
      setSearched(false);
      onAdded();
    } catch {
      // error handled silently
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
                <div className="size-14 shrink-0 rounded-lg border flex items-center justify-center overflow-hidden bg-muted/30">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <ImageOff className="size-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              {showDropdown && (
                <div className="absolute top-full mt-1 left-0 right-14 z-30 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searching ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      {t("inventory.loading")}
                    </div>
                  ) : results.length > 0 ? (
                    results.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                      >
                        <div className="size-8 rounded border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="size-full object-cover" />
                          ) : (
                            <ImageOff className="size-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                        </div>
                      </button>
                    ))
                  ) : searched ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(null);
                        setCategory("Other");
                        setImageUrl(null);
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
                    >
                      <Plus className="size-3.5" />
                      {t("inventory.custom_product", { name: searchTerm })}
                    </button>
                  ) : null}
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
              <Label>{t("inventory.fridge")}</Label>
              <Select value={fridgeId} onValueChange={(v) => v && setFridgeId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fridges.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
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
                step="0.01"
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
          <div className="space-y-1.5">
            <Label htmlFor="expiry">{t("inventory.expiry_date")}</Label>
            <Input
              id="expiry"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>{t("inventory.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={saving || !searchTerm.trim() || !fridgeId}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {t("inventory.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
