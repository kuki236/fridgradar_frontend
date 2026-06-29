"use client";

import { useEffect, useState } from "react";
import { Check, X, Loader2, UserPlus, Inbox } from "lucide-react";
import { invitationsApi, type Invitation } from "@/features/household/infrastructure/invitations.service";
import { useTranslate } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export default function NotificationsPage() {
  const { t } = useTranslate();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadInvitations = () => {
    setLoading(true);
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
    } catch {}
    setActionLoading(null);
  };

  const handleReject = async (inv: Invitation) => {
    setActionLoading(inv.id);
    try {
      await invitationsApi.reject(inv.member_id);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
    } catch {}
    setActionLoading(null);
  };

  return (
    <div className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <PageHeader title={t("notifications.title")} />

        <section className="rounded-xl bg-card ring-1 ring-foreground/5 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="size-4 text-muted-foreground" />
              {t("notifications.invitations_title")}
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-10">
              <Inbox className="size-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">{t("notifications.no_invitations")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {t("notifications.invited_by", { name: inv.inviter_name })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("notifications.to_household", { household: inv.household_name })}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0 ml-3">
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
                      <X className="size-3" />
                      {t("invitations.reject")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
