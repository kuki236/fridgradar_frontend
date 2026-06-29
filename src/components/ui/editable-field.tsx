"use client";

import { useRef, useState, type ReactNode } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslate } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

interface EditableFieldProps {
  label: string;
  value: string;
  /** Save callback. Throws on failure; the row stays in edit mode. */
  onSave: (next: string) => Promise<void>;
  /** Optional icon shown next to the label. */
  icon?: ReactNode;
  /** Input type. Defaults to "text". */
  inputType?: "text" | "email";
  /** When true, the value is shown muted and no edit button is rendered. */
  readOnly?: boolean;
  /** Hint shown beneath the row when readOnly. */
  readOnlyHint?: string;
  /** Extra validation: must not be empty. */
  required?: boolean;
}

/**
 * A single label/value row that can switch into an inline editor on click.
 *
 * The Settings audit flagged that the previous rows (e.g. "Name" / "Email" /
 * "Household name") displayed plain text on the right, leaving users unsure
 * whether the field was editable. This component makes the affordance
 * explicit: a pencil button reveals an input + save/cancel, and `readOnly`
 * rows are visually muted so users don't try to interact with them.
 */
export function EditableField({
  label,
  value,
  onSave,
  icon,
  inputType = "text",
  readOnly = false,
  readOnlyHint,
  required = true,
}: EditableFieldProps) {
  const { t } = useTranslate();
  const [editing, setEditing] = useState(false);
  // Reset the draft whenever the upstream `value` changes, EXCEPT while the
  // user is mid-edit (we don't want to clobber what they typed). The previous
  // implementation used a `useEffect` to call setState, which the linter
  // rightly flagged as a cascading-render risk. Re-keying the input on
  // `value` keeps the same behavior without the effect.
  const [draftKey, setDraftKey] = useState(0);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync draft -> value when not editing. We bump a `draftKey` so the input
  // remounts with the fresh value; this avoids `useEffect` + setState.
  const prevValue = useRef(value);
  if (!editing && prevValue.current !== value) {
    prevValue.current = value;
    setDraft(value);
    setDraftKey((k) => k + 1);
    setError(null);
  }

  const handleSave = async () => {
    const next = draft.trim();
    if (required && !next) {
      setError("Required");
      return;
    }
    if (next === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(next);
      setEditing(false);
    } catch {
      // keep the dialog open so the user can retry
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(value);
    setError(null);
    setEditing(false);
  };

  if (readOnly) {
    return (
      <div className="px-4 py-3 opacity-70">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
          <span className="text-sm text-muted-foreground truncate select-all">
            {value || "—"}
          </span>
        </div>
        {readOnlyHint && (
          <p className="text-[11px] text-muted-foreground mt-1 ml-6">{readOnlyHint}</p>
        )}
      </div>
    );
  }

  if (editing) {
    return (
      <div className="px-4 py-3 bg-primary/5">
        <label className="text-xs text-muted-foreground block mb-1.5 flex items-center gap-2">
          {icon}
          {label}
        </label>
        <div className="flex gap-2">
          <Input
            type={inputType}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={saving}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            className={cn(error && "ring-1 ring-urgent")}
          />
          <Button
            type="button"
            size="icon-sm"
            onClick={handleSave}
            disabled={saving}
            aria-label={t("settings.save")}
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
            aria-label={t("settings.cancel")}
          >
            <X className="size-3.5" />
          </Button>
        </div>
        {error && <p className="text-[11px] text-urgent mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium truncate">{value || "—"}</span>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
          aria-label={t("settings.edit")}
        >
          <Pencil className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
