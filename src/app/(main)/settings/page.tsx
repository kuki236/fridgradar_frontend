"use client";

import { useEffect, useState, useCallback } from "react";
import { UserPlus, User, Home, Loader2, LogOut, Palette, Globe, Mail, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/infrastructure/auth.store";
import { authApi } from "@/features/auth/infrastructure/auth.service";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { householdApi, type Member } from "@/features/household/infrastructure/households.service";
import { InviteDialog } from "@/features/household/components/invite-dialog";
import { StorageZonesTree } from "@/features/inventory/components/storage-zones-tree";
import { Button } from "@/components/ui/button";
import { EditableField } from "@/components/ui/editable-field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslate } from "@/lib/i18n-context";
import { useTheme } from "@/lib/theme-provider";
import { themePresets } from "@/lib/themes";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { t, locale, setLocale } = useTranslate();
  const { user, logout, setUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { activeHousehold, households, setActiveHousehold, loadHouseholds } = useHouseholdStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => { loadHouseholds(); }, []);

  const loadMembers = useCallback(() => {
    if (activeHousehold) {
      setLoadingMembers(true);
      householdApi.members(activeHousehold.id).then(setMembers).catch(() => {}).finally(() => setLoadingMembers(false));
    }
  }, [activeHousehold]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleSaveName = async (next: string) => {
    const updated = await authApi.updateMe({ full_name: next });
    setUser(updated);
    toast.success(t("settings.profile_updated"));
  };

  const handleSaveHouseholdName = async (next: string) => {
    if (!activeHousehold) return;
    const updated = await householdApi.update(activeHousehold.id, { name: next });
    toast.success(t("settings.household_updated"));
    // refresh the active household in the store
    setActiveHousehold({ ...activeHousehold, name: updated.name });
    await loadHouseholds();
  };

  const handleConfirmRemoveMember = async () => {
    if (!activeHousehold || !memberToRemove) return;
    setRemovingMember(memberToRemove.id);
    try {
      await householdApi.removeMember(activeHousehold.id, memberToRemove.id);
      setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
      setMemberToRemove(null);
    } catch {
      toast.error(t("settings.remove_error"));
    } finally {
      setRemovingMember(null);
    }
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      // Best-effort server-side revoke (RF-AUT-004). The store cleanup
      // runs unconditionally so the user always gets back to /login.
      await authApi.logout().catch(() => {});
    } finally {
      logout();
    }
  };

  return (
    <div className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <PageHeader title={t("settings.title")} />

        {/* Appearance */}
        <section className="rounded-xl bg-card ring-1 ring-foreground/5 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Palette className="size-4 text-muted-foreground" />
              {t("settings.appearance")}
            </h2>
          </div>

          {/* Language — chip style consistent with the theme selector below */}
          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="size-4 text-muted-foreground" />
                <span className="text-sm">{t("settings.language")}</span>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {(["en", "es"] as const).map((lng) => (
                  <button
                    key={lng}
                    onClick={() => setLocale(lng)}
                    className={cn(
                      "size-9 rounded-full text-xs font-semibold transition-all flex items-center justify-center",
                      locale === lng
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30 scale-105"
                        : "bg-muted text-muted-foreground hover:bg-accent",
                    )}
                    aria-pressed={locale === lng}
                    aria-label={lng.toUpperCase()}
                  >
                    {lng.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Theme — circular color swatches + label */}
          <div className="px-4 py-3">
            <span className="text-sm block mb-2">{t("settings.theme")}</span>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(themePresets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={cn(
                    "flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    theme === key
                      ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                      : "bg-muted text-muted-foreground hover:bg-accent",
                  )}
                >
                  <span
                    className="size-5 rounded-full ring-2 ring-background"
                    style={{ backgroundColor: preset.primary }}
                  />
                  {t(`settings.theme_presets.${key}` as any)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Account — name editable, email read-only */}
        <section className="rounded-xl bg-card ring-1 ring-foreground/5 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              {t("settings.account")}
            </h2>
          </div>
          <div className="divide-y divide-border/50">
            <EditableField
              label={t("settings.name")}
              value={user?.full_name ?? ""}
              onSave={handleSaveName}
              icon={<User className="size-4 text-muted-foreground" />}
            />
            <EditableField
              label={t("settings.email")}
              value={user?.email ?? ""}
              onSave={async () => { /* readOnly — never called */ }}
              icon={<Mail className="size-4 text-muted-foreground" />}
              readOnly
              readOnlyHint={t("settings.email_readonly_hint")}
            />
          </div>
        </section>

        {/* Household — name + timezone editable, members list, invite */}
        <section className="rounded-xl bg-card ring-1 ring-foreground/5 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Home className="size-4 text-muted-foreground" />
              {t("settings.household")}
            </h2>
            <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-3.5" />
              {t("settings.invite")}
            </Button>
          </div>

          {households.length > 1 && (
            <div className="px-4 py-3 border-b border-border/50">
              <label className="text-xs text-muted-foreground block mb-1.5">
                {t("settings.switch_household")}
              </label>
              <div className="flex gap-2 flex-wrap">
                {households.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setActiveHousehold(h)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      activeHousehold?.id === h.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeHousehold && (
            <div className="divide-y divide-border/50">
              <EditableField
                label={t("settings.name")}
                value={activeHousehold.name}
                onSave={handleSaveHouseholdName}
                icon={<Home className="size-4 text-muted-foreground" />}
              />
              <EditableField
                label={t("settings.timezone")}
                value={activeHousehold.timezone}
                onSave={async (next) => {
                  if (!activeHousehold) return;
                  await householdApi.update(activeHousehold.id, { timezone: next });
                  setActiveHousehold({ ...activeHousehold, timezone: next });
                  await loadHouseholds();
                  toast.success(t("settings.household_updated"));
                }}
                icon={<Clock className="size-4 text-muted-foreground" />}
              />
            </div>
          )}

          <div className="px-4 py-3 border-t border-border/50">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {t("settings.members")} ({members.length})
            </h3>
            {loadingMembers ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">{t("settings.no_members")}</p>
            ) : (
              <div className="space-y-1">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {member.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{member.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] font-medium uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {member.role}
                      </span>
                      {activeHousehold && user && activeHousehold.owner_user_id === user.id && member.user_id !== user.id && (
                        <button
                          onClick={() => setMemberToRemove(member)}
                          disabled={removingMember === member.id}
                          className="text-muted-foreground hover:text-urgent hover:bg-urgent-bg/40 transition-colors p-1.5 rounded-md"
                          title={t("settings.remove_member")}
                          aria-label={t("settings.remove_member")}
                        >
                          {removingMember === member.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Storage + Zones — nested accordion (RF-INV-001, RF-INV-002) */}
        <StorageZonesTree />

        <InviteDialog open={inviteOpen} onClose={() => { setInviteOpen(false); loadMembers(); }} />

        {/* Danger zone — isolated at the very bottom so it can't be hit
            accidentally while configuring the household. */}
        <section className="rounded-xl bg-card ring-1 ring-foreground/5 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <h2 className="text-sm font-medium text-muted-foreground">{t("settings.account")}</h2>
          </div>
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{t("settings.logout")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("settings.logout_confirm")}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLogoutOpen(true)}
              className="text-urgent hover:bg-urgent-bg/40 hover:border-urgent/30 hover:text-urgent"
            >
              <LogOut className="size-3.5" />
              {t("settings.logout")}
            </Button>
          </div>
        </section>
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={memberToRemove !== null}
        onOpenChange={(o) => { if (!o) setMemberToRemove(null); }}
        title={t("settings.confirm_delete_member_title")}
        description={t("settings.confirm_delete_member_desc")}
        confirmLabel={t("settings.remove_member")}
        onConfirm={handleConfirmRemoveMember}
      />

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title={t("settings.logout")}
        description={t("settings.logout_confirm")}
        confirmLabel={t("settings.logout")}
        variant="destructive"
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
