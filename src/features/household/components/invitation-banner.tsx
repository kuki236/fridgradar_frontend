"use client";

import { useEffect, useState } from "react";
import { X, UserPlus, Loader2, Check, X as XIcon } from "lucide-react";
import { invitationsApi, type Invitation } from "@/features/household/infrastructure/invitations.service";
import { useTranslate } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function InvitationBanner() {
  const { t } = useTranslate();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const loadInvitations = () => {
    invitationsApi.pending()
      .then(setInvitations)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadInvitations(); }, []);

  const handleAccept = async (inv: Invitation) => {
    setActionLoading(inv.id);
    try {
      await invitationsApi.accept(inv.member_id);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
      loadInvitations();
    } catch {}
    setActionLoading(null);
  };

  const handleReject = async (inv: Invitation) => {
    setActionLoading(inv.id);
    try {
      await invitationsApi.reject(inv.member_id);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
      loadInvitations();
    } catch {}
    setActionLoading(null);
  };

  if (loading || invitations.length === 0 || dismissed) return null;

  return (
    <div className="bg-primary/5 border-b border-primary/10 px-4 py-2">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <UserPlus className="size-4 text-primary shrink-0" />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {invitations.map((inv) => (
              <span key={inv.id} className="text-sm text-foreground">
                {t("invitations.from", { name: inv.inviter_name, household: inv.household_name })}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {invitations.map((inv) => (
            <div key={inv.id} className="flex gap-1">
              <Button
                size="xs"
                variant="default"
                onClick={() => handleAccept(inv)}
                disabled={actionLoading === inv.id}
              >
                {actionLoading === inv.id ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Check className="size-3" />
                )}
                {t("invitations.accept")}
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => handleReject(inv)}
                disabled={actionLoading === inv.id}
              >
                <XIcon className="size-3" />
                {t("invitations.reject")}
              </Button>
            </div>
          ))}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
