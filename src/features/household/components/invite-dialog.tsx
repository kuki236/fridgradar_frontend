"use client";

import { useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import { householdApi } from "@/features/household/infrastructure/households.service";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { useTranslate } from "@/lib/i18n-context";

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
}

export function InviteDialog({ open, onClose }: InviteDialogProps) {
  const { t } = useTranslate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const { activeHousehold } = useHouseholdStore();

  if (!open) return null;

  const handleInvite = async () => {
    if (!email.trim() || !activeHousehold) return;
    setStatus("loading");
    try {
      await householdApi.invite(activeHousehold.id, email.trim());
      setStatus("success");
      setMessage("Member invited!");
      setEmail("");
      setTimeout(() => {
        setStatus("idle");
        onClose();
      }, 1500);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to invite");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">{t("settings.invite_member")}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("settings.invite_placeholder")}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none transition-colors"
          />

          <button
            onClick={handleInvite}
            disabled={status === "loading"}
            className="inline-flex items-center justify-center gap-2 w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            {status === "loading" ? t("settings.inviting") : t("settings.send_invite")}
          </button>

          {status === "success" && (
            <p className="text-xs text-safe text-center">{t("settings.invite_success")}</p>
          )}
          {status === "error" && (
            <p className="text-xs text-urgent text-center">{t("settings.invite_error", { msg: message })}</p>
          )}
        </div>
      </div>
    </div>
  );
}
