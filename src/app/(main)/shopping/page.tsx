"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  Plus, Trash2, ShoppingCart, Loader2, Check, MoreVertical,
  Pencil, CheckCheck, Sparkles, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { shoppingApi, type ShoppingItem } from "@/features/shopping/infrastructure/shopping.service";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { NoHouseholdGuard } from "@/features/household/components/no-household-guard";
import { useTranslate } from "@/lib/i18n-context";
import { getCategoryStyle } from "@/features/inventory/lib/category-icons";
import { formatCategory } from "@/features/inventory/lib/format-category";
import { lookupProduct, suggestProducts, type ResolvedProduct } from "@/features/inventory/lib/lookup-product";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const UNITS = ["units", "kg", "g", "lt", "ml", "cda", "cdta", "taza", "oz", "lb"] as const;
type Unit = (typeof UNITS)[number];

interface DraftItem {
  name: string;
  quantity: number;
  unit: Unit;
}

const EMPTY_DRAFT: DraftItem = { name: "", quantity: 1, unit: "units" };

/** Custom-styled native <select> with our own chevron and no platform chrome. */
function UnitSelect({
  value, onChange, id, className,
}: { value: Unit; onChange: (u: Unit) => void; id?: string; className?: string }) {
  const { t } = useTranslate();
  return (
    <div className={cn("relative", className)}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as Unit)}
        className="w-full h-9 appearance-none rounded-md border border-input bg-background pl-2 pr-7 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none cursor-pointer"
      >
        {UNITS.map((u) => (
          <option key={u} value={u}>{t(`inventory.unit_${u}` as any) || u}</option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

export default function ShoppingPage() {
  const { t } = useTranslate();
  const { activeHousehold } = useHouseholdStore();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick add state (RF-INV-011): inline autocomplete
  const [draft, setDraft] = useState<DraftItem>(EMPTY_DRAFT);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Edit modal
  const [editing, setEditing] = useState<ShoppingItem | null>(null);
  const [editDraft, setEditDraft] = useState<DraftItem>(EMPTY_DRAFT);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadItems = useCallback(() => {
    if (!activeHousehold) return;
    setLoading(true);
    shoppingApi.getCurrent(activeHousehold.id).then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [activeHousehold]);

  useEffect(() => { loadItems(); }, [loadItems]);

  // Live suggestions derived from the current draft name.
  const suggestions = useMemo(() => suggestProducts(draft.name, 6), [draft.name]);
  const resolved = useMemo(() => lookupProduct(draft.name), [draft.name]);

  const handlePickSuggestion = (s: ResolvedProduct) => {
    setDraft({ name: s.name, quantity: s.defaultQuantity, unit: s.unit as Unit });
    setShowSuggestions(false);
    setActiveSuggestion(0);
    inputRef.current?.focus();
  };

  const handleAdd = async () => {
    const name = draft.name.trim();
    if (!name || !activeHousehold) return;
    setAdding(true);
    try {
      await shoppingApi.add(
        activeHousehold.id,
        name,
        draft.quantity || undefined,
        draft.unit || undefined,
      );
      setDraft(EMPTY_DRAFT);
      setShowSuggestions(false);
      setActiveSuggestion(0);
      loadItems();
    } catch {
      // error handled silently
    }
    setAdding(false);
  };

  const handleAddKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" && activeSuggestion >= 0) {
        e.preventDefault();
        handlePickSuggestion(suggestions[activeSuggestion]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      void handleAdd();
    }
  };

  const handleToggle = async (item: ShoppingItem) => {
    await shoppingApi.update(item.id, { checked: !item.checked }).catch(() => {});
    loadItems();
  };

  const handleDelete = async (id: string) => {
    await shoppingApi.delete(id).catch(() => {});
    loadItems();
  };

  const handleClearPurchased = async () => {
    const purchased = items.filter((i) => i.checked);
    if (purchased.length === 0) return;
    await Promise.all(purchased.map((i) => shoppingApi.delete(i.id).catch(() => {})));
    toast.success(t("shopping.purchased_cleared", { n: purchased.length }));
    loadItems();
  };

  const openEdit = (item: ShoppingItem) => {
    setEditing(item);
    setEditDraft({
      name: item.product_name,
      quantity: item.quantity ?? 1,
      unit: (item.unit as Unit) ?? "units",
    });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const name = editDraft.name.trim();
    if (!name) return;
    setSavingEdit(true);
    try {
      await shoppingApi.update(editing.id, {
        product_name: name,
        quantity: editDraft.quantity,
        unit: editDraft.unit,
      });
      setEditing(null);
      loadItems();
    } catch {
      // error handled silently
    }
    setSavingEdit(false);
  };

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <NoHouseholdGuard>
      <div className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <PageHeader
            title={t("shopping.title")}
            subtitle={
              !loading && items.length > 0
                ? t("shopping.remaining", { count: unchecked.length })
                : null
            }
            actions={
              checked.length > 0 ? (
                <Button variant="ghost" size="sm" onClick={handleClearPurchased} className="hidden sm:inline-flex">
                  <CheckCheck className="size-3.5" />
                  {t("shopping.clear_purchased")}
                </Button>
              ) : null
            }
          />
          {checked.length > 0 && (
            <div className="sm:hidden -mt-2">
              <Button variant="ghost" size="sm" onClick={handleClearPurchased} className="w-full justify-center">
                <CheckCheck className="size-3.5" />
                {t("shopping.clear_purchased")}
              </Button>
            </div>
          )}

          {/* Quick add with autocomplete (RF-INV-011) */}
          <QuickAddCard
            draft={draft}
            setDraft={setDraft}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            suggestions={suggestions}
            activeSuggestion={activeSuggestion}
            setActiveSuggestion={setActiveSuggestion}
            adding={adding}
            inputRef={inputRef}
            resolvedPreview={resolved}
            onAdd={handleAdd}
            onPick={handlePickSuggestion}
            onKeyDown={handleAddKey}
          />

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart className="size-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium">{t("shopping.empty_title")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("shopping.empty_desc")}</p>
            </div>
          ) : (
            <ul className="rounded-xl bg-card ring-1 ring-foreground/5 divide-y shadow-card overflow-visible">
              {unchecked.map((item) => (
                <ShoppingRow
                  key={item.id}
                  item={item}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={openEdit}
                />
              ))}
              {checked.length > 0 && (
                <>
                  <li className="px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/50 flex items-center gap-2">
                    <CheckCheck className="size-3" />
                    {t("shopping.purchased")} ({checked.length})
                  </li>
                  {checked.map((item) => (
                    <ShoppingRow
                      key={item.id}
                      item={item}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onEdit={openEdit}
                    />
                  ))}
                </>
              )}
            </ul>
          )}

          <p className="text-[11px] text-muted-foreground text-center md:hidden">
            {t("shopping.swipe_hint")}
          </p>
        </div>

        {/* Edit modal */}
        <Dialog open={editing !== null} onOpenChange={(o) => { if (!o) setEditing(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? t("shopping.edit_title", { name: editing.product_name }) : ""}</DialogTitle>
            </DialogHeader>
            <EditForm draft={editDraft} setDraft={setEditDraft} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                {t("shopping.cancel")}
              </Button>
              <Button onClick={handleSaveEdit} disabled={savingEdit || !editDraft.name.trim()}>
                {savingEdit && <Loader2 className="size-4 animate-spin" />}
                {t("shopping.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </NoHouseholdGuard>
  );
}

// ----------------------------------------------------------------------------
// Quick add card
// ----------------------------------------------------------------------------

interface QuickAddCardProps {
  draft: DraftItem;
  setDraft: (d: DraftItem) => void;
  showSuggestions: boolean;
  setShowSuggestions: (v: boolean) => void;
  suggestions: ResolvedProduct[];
  activeSuggestion: number;
  setActiveSuggestion: (i: number | ((i: number) => number)) => void;
  adding: boolean;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  resolvedPreview: ResolvedProduct | null;
  onAdd: () => void;
  onPick: (s: ResolvedProduct) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

function QuickAddCard({
  draft, setDraft, showSuggestions, setShowSuggestions,
  suggestions, activeSuggestion, setActiveSuggestion, adding,
  inputRef, resolvedPreview, onAdd, onPick, onKeyDown,
}: QuickAddCardProps) {
  const { t } = useTranslate();
  const previewStyle = resolvedPreview ? getCategoryStyle(resolvedPreview.category) : null;
  const PreviewIcon = previewStyle?.icon;

  return (
    <div className="rounded-xl bg-card ring-1 ring-foreground/5 shadow-card p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("shopping.add_quick_title")}
        </span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={draft.name}
            onChange={(e) => {
              setDraft({ ...draft, name: e.target.value });
              setShowSuggestions(true);
              setActiveSuggestion(0);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={onKeyDown}
            placeholder={t("shopping.add_placeholder")}
            autoComplete="off"
            className="h-9"
          />
          {showSuggestions && draft.name.trim().length > 0 && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-lg bg-popover ring-1 ring-foreground/10 shadow-lg overflow-hidden">
              {suggestions.length > 0 ? (
                <>
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
                    {t("shopping.suggestions")}
                  </p>
                  <ul>
                    {suggestions.map((s, i) => {
                      const style = getCategoryStyle(s.category);
                      const Icon = style.icon;
                      const active = i === activeSuggestion;
                      return (
                        <li key={s.name}>
                          <button
                            type="button"
                            onMouseEnter={() => setActiveSuggestion(i)}
                            onMouseDown={(e) => { e.preventDefault(); onPick(s); }}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                              active ? "bg-primary/10" : "hover:bg-accent",
                            )}
                          >
                            <div className={cn("size-7 rounded-md flex items-center justify-center shrink-0", style.bg)}>
                              <Icon className={cn("size-3.5", style.fg)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium">{s.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {formatCategory(s.category, t)} · {t(`inventory.unit_${s.unit}` as any) || s.unit}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <p className="px-3 py-2.5 text-xs text-muted-foreground">
                  {t("shopping.no_suggestions")}
                </p>
              )}
            </div>
          )}
        </div>
        <Button
          onClick={onAdd}
          disabled={adding || !draft.name.trim()}
          className="shrink-0"
        >
          {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {t("shopping.add")}
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">{t("shopping.add_hint")}</p>

      {resolvedPreview && PreviewIcon && previewStyle && (
        <div className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-2.5 py-2">
          <div className={cn("size-8 rounded-md flex items-center justify-center shrink-0", previewStyle.bg)}>
            <PreviewIcon className={cn("size-4", previewStyle.fg)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{t("shopping.choose_category")}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {formatCategory(resolvedPreview.category, t)}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[11px] text-muted-foreground font-medium">{t("shopping.qty")}</label>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            value={Number.isFinite(draft.quantity) ? draft.quantity : 0}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setDraft({ ...draft, quantity: Number.isFinite(v) ? v : 0 });
            }}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-muted-foreground font-medium">{t("shopping.unit")}</label>
          <UnitSelect
            value={draft.unit}
            onChange={(u) => setDraft({ ...draft, unit: u })}
          />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Shopping row
// ----------------------------------------------------------------------------

interface ShoppingRowProps {
  item: ShoppingItem;
  onToggle: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
  onEdit: (item: ShoppingItem) => void;
}

function ShoppingRow({ item, onToggle, onDelete, onEdit }: ShoppingRowProps) {
  const { t } = useTranslate();
  const resolved = useMemo(() => lookupProduct(item.product_name), [item.product_name]);
  const category = resolved?.category ?? "Otros";
  const style = getCategoryStyle(category);
  const Icon = style.icon;

  // Menu uses a portal so it can never be clipped by the row's overflow or
  // covered by a sibling row. The previous implementation lived inside the
  // transformed swipe container, which created a stacking context and made
  // the menu render BEHIND the next row in the list.
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);

  const openMenu = () => {
    const rect = menuBtnRef.current?.getBoundingClientRect();
    if (rect) {
      // Anchor the menu's left edge to the trigger's right edge, then nudge
      // left by the menu's expected width (160px) so the menu visually sits
      // flush-right under the trigger.
      setMenuPos({
        top: rect.bottom + 6,
        left: Math.max(8, rect.right - 160),
      });
    }
    setMenuOpen(true);
  };

  // Close on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-shopping-menu]")) setMenuOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    // Recompute position on scroll/resize so the menu stays attached to its
    // trigger even when the list is scrolled.
    const reposition = () => {
      const rect = menuBtnRef.current?.getBoundingClientRect();
      if (rect) {
        setMenuPos({
          top: rect.bottom + 6,
          left: Math.max(8, rect.right - 160),
        });
      }
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [menuOpen]);

  // Mobile swipe-to-delete: simple pointer-based drag that reveals a trash
  // surface underneath the row. Once dragged past a threshold, releasing
  // deletes the item.
  const rowRef = useRef<HTMLLIElement | null>(null);
  const [dragX, setDragX] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const SWIPE_THRESHOLD = -96;

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    dragStartX.current = e.clientX;
    rowRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    if (dx < 0) setDragX(Math.max(dx, -140));
    else setDragX(0);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    rowRef.current?.releasePointerCapture(e.pointerId);
    if (dragX <= SWIPE_THRESHOLD) onDelete(item.id);
    setDragX(0);
    dragStartX.current = null;
  };

  return (
    <li
      ref={rowRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative overflow-hidden"
    >
      {/* Swipe-to-delete backdrop (mobile only) */}
      <div
        className="md:hidden absolute inset-y-0 right-0 flex items-center justify-end pr-5 bg-urgent text-urgent-foreground"
        style={{ width: Math.abs(Math.min(dragX, 0)) }}
        aria-hidden
      >
        <Trash2 className="size-4" />
      </div>

      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 bg-card transition-transform",
          !item.checked && "hover:bg-muted/30",
        )}
        style={{ transform: `translateX(${dragX}px)` }}
      >
        <button
          onClick={() => onToggle(item)}
          className={cn(
            "size-5 rounded flex items-center justify-center shrink-0 transition-colors",
            item.checked
              ? "bg-primary text-primary-foreground"
              : "border border-muted-foreground/30 hover:border-primary/50",
          )}
          aria-label={item.checked ? "Mark as not purchased" : "Mark as purchased"}
        >
          {item.checked && <Check className="size-3" />}
        </button>

        <div
          className={cn(
            "size-9 rounded-lg flex items-center justify-center shrink-0",
            style.bg,
          )}
          aria-hidden
        >
          <Icon className={cn("size-4", style.fg)} />
        </div>

        {/* The text column uses items-start + leading-tight on the name so
            the icon (size-9) and the first line of text share the same
            visual top, and the secondary info sits directly under the name
            with a balanced gap. */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium truncate leading-tight",
              item.checked && "line-through text-muted-foreground/60",
            )}
          >
            {item.product_name}
          </p>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-muted-foreground/80 leading-none">
              {formatCategory(category, t)}
            </span>
            {(item.quantity || item.unit) && (
              <span className="inline-flex items-center tabular-nums leading-none">
                {item.quantity ?? "—"}
                {item.unit ? ` ${t(`inventory.unit_${item.unit}` as any) || item.unit}` : ""}
              </span>
            )}
          </div>
        </div>

        {/* Always-visible 3-dot menu trigger (RF-INV-012). The dropdown is
            rendered into a portal — see top of the component — so it floats
            above the rest of the list and is fully clickable. */}
        <button
          ref={menuBtnRef}
          type="button"
          aria-label={t("shopping.more_actions")}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (menuOpen) setMenuOpen(false);
            else openMenu();
          }}
          className="shrink-0 p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <MoreVertical className="size-4" />
        </button>
      </div>

      {menuOpen && menuPos && typeof document !== "undefined" && createPortal(
        <div
          data-shopping-menu
          role="menu"
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
          className="flex flex-col bg-popover ring-1 ring-foreground/10 rounded-lg shadow-lg py-1 min-w-[10rem]"
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => { setMenuOpen(false); onEdit(item); }}
            className="flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-accent transition-colors"
          >
            <Pencil className="size-3.5" />
            {t("shopping.edit")}
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => { setMenuOpen(false); onDelete(item.id); }}
            className="flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-urgent-bg/40 text-urgent transition-colors"
          >
            <Trash2 className="size-3.5" />
            {t("shopping.delete")}
          </button>
        </div>,
        document.body,
      )}
    </li>
  );
}

// ----------------------------------------------------------------------------
// Edit form
// ----------------------------------------------------------------------------

function EditForm({ draft, setDraft }: { draft: DraftItem; setDraft: (d: DraftItem) => void }) {
  const { t } = useTranslate();
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground font-medium">{t("inventory.name")}</label>
        <Input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">{t("shopping.qty")}</label>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            value={Number.isFinite(draft.quantity) ? draft.quantity : 0}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setDraft({ ...draft, quantity: Number.isFinite(v) ? v : 0 });
            }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">{t("shopping.unit")}</label>
          <UnitSelect
            value={draft.unit}
            onChange={(u) => setDraft({ ...draft, unit: u })}
          />
        </div>
      </div>
    </div>
  );
}
