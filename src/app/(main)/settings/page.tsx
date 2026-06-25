"use client";

import { useEffect, useState, useCallback } from "react";
import { UserPlus, User, Home, Loader2, LogOut, Palette, Globe, Trash2, Refrigerator as FridgeIcon, Box, Snowflake, Plus } from "lucide-react";
import { useAuthStore } from "@/features/auth/infrastructure/auth.store";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { householdApi, type Member } from "@/features/household/infrastructure/households.service";
import { refrigeratorApi, type Refrigerator } from "@/features/inventory/infrastructure/refrigerators.service";
import { InviteDialog } from "@/features/household/components/invite-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslate } from "@/lib/i18n-context";
import { useTheme } from "@/lib/theme-provider";
import { themePresets } from "@/lib/themes";

export default function SettingsPage() {
  const { t, locale, setLocale } = useTranslate();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { activeHousehold, households, setActiveHousehold, loadHouseholds } = useHouseholdStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [fridges, setFridges] = useState<Refrigerator[]>([]);
  const [fridgeDialogOpen, setFridgeDialogOpen] = useState(false);
  const [newFridgeName, setNewFridgeName] = useState("");
  const [newFridgeType, setNewFridgeType] = useState("refrigerator");
  const [savingFridge, setSavingFridge] = useState(false);
  const [deletingFridge, setDeletingFridge] = useState<string | null>(null);

  useEffect(() => { loadHouseholds(); }, []);

  const loadMembers = useCallback(() => {
    if (activeHousehold) {
      setLoadingMembers(true);
      householdApi.members(activeHousehold.id).then(setMembers).catch(() => {}).finally(() => setLoadingMembers(false));
    }
  }, [activeHousehold]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const loadFridges = useCallback(() => {
    if (activeHousehold) {
      refrigeratorApi.list(activeHousehold.id).then(setFridges).catch(() => {});
    }
  }, [activeHousehold]);

  useEffect(() => { loadFridges(); }, [loadFridges]);

  const handleAddFridge = async () => {
    if (!activeHousehold || !newFridgeName.trim()) return;
    setSavingFridge(true);
    try {
      await refrigeratorApi.create({
        household_id: activeHousehold.id,
        name: newFridgeName.trim(),
        type: newFridgeType,
      });
      setFridgeDialogOpen(false);
      setNewFridgeName("");
      setNewFridgeType("refrigerator");
      loadFridges();
    } catch {
      // error handled silently
    }
    setSavingFridge(false);
  };

  const handleDeleteFridge = async (id: string) => {
    if (!confirm(t("settings.confirm_delete_fridge"))) return;
    setDeletingFridge(id);
    try {
      await refrigeratorApi.delete(id);
      setFridges((prev) => prev.filter((f) => f.id !== id));
    } catch {
      // error handled silently
    }
    setDeletingFridge(null);
  };

  const fridgeIcons: Record<string, typeof FridgeIcon> = {
    refrigerator: FridgeIcon,
    freezer: Snowflake,
    pantry: Box,
    other: Box,
  };

  const handleRemoveMember = async (member: Member) => {
    if (!activeHousehold || !confirm(t("settings.confirm_remove"))) return;
    setRemovingMember(member.id);
    try {
      await householdApi.removeMember(activeHousehold.id, member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch {
      alert(t("settings.remove_error"));
    }
    setRemovingMember(null);
  };

  return (
    <div className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-xl font-semibold tracking-tight">{t("settings.title")}</h1>

        {/* Appearance */}
        <section className="rounded-xl bg-card ring-1 ring-foreground/5 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Palette className="size-4 text-muted-foreground" />
              {t("settings.appearance")}
            </h2>
          </div>
          <div className="divide-y divide-border/50">
            {/* Language */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" />
                  <span className="text-sm">{t("settings.language")}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setLocale("en")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      locale === "en" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setLocale("es")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      locale === "es" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    ES
                  </button>
                </div>
              </div>
            </div>

            {/* Theme */}
            <div className="px-4 py-3">
              <span className="text-sm block mb-2">{t("settings.theme")}</span>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(themePresets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      theme === key
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <span className="size-3 rounded-full" style={{ backgroundColor: preset.primary }} />
                    {t(`settings.theme_presets.${key}` as any)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Account */}
        <section className="rounded-xl bg-card ring-1 ring-foreground/5 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              {t("settings.account")}
            </h2>
          </div>
          <div className="divide-y divide-border/50">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">{t("settings.name")}</span>
              <span className="text-sm font-medium">{user?.full_name}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">{t("settings.email")}</span>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
            <div className="px-4 py-3">
              <Button variant="destructive" size="sm" onClick={logout} className="w-full">
                <LogOut className="size-3.5" />
                {t("settings.logout")}
              </Button>
            </div>
          </div>
        </section>

        {/* Household */}
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
              <label className="text-xs text-muted-foreground block mb-1.5">{t("settings.switch_household")}</label>
              <div className="flex gap-2 flex-wrap">
                {households.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setActiveHousehold(h)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeHousehold?.id === h.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeHousehold && (
            <div className="divide-y divide-border/50">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">{t("settings.name")}</span>
                <span className="text-sm font-medium">{activeHousehold.name}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">{t("settings.timezone")}</span>
                <span className="text-sm text-muted-foreground">{activeHousehold.timezone}</span>
              </div>
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
                          onClick={() => handleRemoveMember(member)}
                          disabled={removingMember === member.id}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          title={t("settings.remove_member")}
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

        {/* Storage */}
        <section className="rounded-xl bg-card ring-1 ring-foreground/5 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <FridgeIcon className="size-4 text-muted-foreground" />
              {t("settings.storage")}
            </h2>
            <Dialog open={fridgeDialogOpen} onOpenChange={setFridgeDialogOpen}>
              <DialogTrigger render={<Button variant="outline" size="sm"><Plus className="size-3.5" />{t("settings.add_fridge")}</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("settings.add_fridge")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fridge-name">{t("settings.fridge_name")}</Label>
                    <Input
                      id="fridge-name"
                      value={newFridgeName}
                      onChange={(e) => setNewFridgeName(e.target.value)}
                      placeholder={t("settings.fridge_name")}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("settings.fridge_type")}</Label>
                    <Select value={newFridgeType} onValueChange={(v) => v && setNewFridgeType(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="refrigerator">Refrigerator</SelectItem>
                        <SelectItem value="freezer">Freezer</SelectItem>
                        <SelectItem value="pantry">Pantry</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setFridgeDialogOpen(false)}>{t("inventory.cancel")}</Button>
                  <Button onClick={handleAddFridge} disabled={savingFridge || !newFridgeName.trim()}>
                    {savingFridge && <Loader2 className="size-4 animate-spin" />}
                    {t("inventory.save")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="divide-y divide-border/50">
            {fridges.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                {t("settings.storage")}...
              </div>
            ) : (
              fridges.map((fridge) => {
                const Icon = fridgeIcons[fridge.type] || Box;
                return (
                  <div key={fridge.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                        <Icon className="size-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{fridge.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{fridge.type}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFridge(fridge.id)}
                      disabled={deletingFridge === fridge.id}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0 ml-2"
                      title={t("settings.delete_fridge")}
                    >
                      {deletingFridge === fridge.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <InviteDialog open={inviteOpen} onClose={() => { setInviteOpen(false); loadMembers(); }} />
      </div>
    </div>
  );
}
