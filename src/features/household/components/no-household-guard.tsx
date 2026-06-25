"use client";

import { useState } from "react";
import { Users, Plus, Loader2 } from "lucide-react";
import { useHouseholdStore } from "@/features/household/infrastructure/households.store";
import { useTranslate } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function CreateHouseholdDialog() {
  const { t } = useTranslate();
  const { createHousehold } = useHouseholdStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createHousehold(name.trim());
      setName("");
      setOpen(false);
    } catch {}
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><Plus className="size-4" />{t("home.create_household")}</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("home.create_household")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("home.household_name")}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>{t("home.cancel")}</Button>
            <Button onClick={handleCreate} disabled={saving || !name.trim()}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("home.create")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface NoHouseholdGuardProps {
  children: React.ReactNode;
}

export function NoHouseholdGuard({ children }: NoHouseholdGuardProps) {
  const { t } = useTranslate();
  const { activeHousehold, isLoading } = useHouseholdStore();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!activeHousehold) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Users className="size-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-2">{t("home.no_household_title")}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t("home.no_household_desc")}</p>
          <CreateHouseholdDialog />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
