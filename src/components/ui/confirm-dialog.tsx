"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslate } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Title shown in the dialog header. */
  title: string;
  /** Longer description explaining the consequences of the action. */
  description: string;
  /** Label of the destructive confirm button. */
  confirmLabel?: string;
  /** Label of the cancel button. */
  cancelLabel?: string;
  /** Visual variant: "destructive" (red, default) or "primary". */
  variant?: "destructive" | "primary";
  /** Async callback fired when the user confirms. */
  onConfirm: () => Promise<void> | void;
  /** Custom icon. Defaults to a destructive trash icon. */
  icon?: ReactNode;
}

/**
 * Reusable confirmation dialog used by destructive actions across the app
 * (Settings page: remove member, delete storage, delete zone).
 *
 * The Settings audit flagged that the previous implementation used the
 * native `confirm()` browser dialog, which is jarring, not localizable,
 * and provides no clear visual feedback that the action is destructive.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "destructive",
  onConfirm,
  icon,
}: ConfirmDialogProps) {
  const { t } = useTranslate();
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    if (pending) return;
    setPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Caller is responsible for showing the error toast; we just keep
      // the dialog open so the user can retry or cancel.
    } finally {
      setPending(false);
    }
  };

  const Icon = icon ?? (variant === "destructive" ? <Trash2 className="size-5" /> : <AlertTriangle className="size-5" />);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "size-10 rounded-lg flex items-center justify-center shrink-0",
                variant === "destructive"
                  ? "bg-urgent-bg text-urgent"
                  : "bg-attention-bg text-attention",
              )}
            >
              {Icon}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1.5">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {cancelLabel ?? t("settings.cancel")}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending && <Loader2 className="size-3.5 animate-spin" />}
            {confirmLabel ?? t("settings.delete_zone")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
