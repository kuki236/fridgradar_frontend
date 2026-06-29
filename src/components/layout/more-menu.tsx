"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, MoreHorizontal, ChevronRight, Menu } from "lucide-react";
import { useTranslate } from "@/lib/i18n-context";
import { MORE_ITEMS } from "@/lib/nav-config";
import { useAuthStore } from "@/features/auth/infrastructure/auth.store";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type MoreMenuVariant = "tab" | "icon";

interface MoreMenuProps {
  variant?: MoreMenuVariant;
  className?: string;
}

/**
 * Mobile-only "Menú" sheet + trigger.
 *
 * The mobile bottom nav only has 4 day-to-day tabs; everything else
 * (Activity, Alerts, Settings, etc.) lives behind this trigger. Renders
 * the same drawer regardless of `variant`; the variant only changes the
 * trigger button styling:
 *
 *  - `tab`  → the original "Más" tab for the bottom nav. Kept exported
 *             for backwards compatibility but no longer used by
 *             `MobileNav` (RF-NAV-005: the header hamburger replaces it).
 *  - `icon` → a small hamburger button meant to sit to the left of the
 *             page title in each page's `<PageHeader>`.
 */
export function MoreMenu({ variant = "tab", className }: MoreMenuProps) {
  const { t } = useTranslate();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(pathname);

  useEffect(() => {
    setCurrentPath(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const sync = () => setCurrentPath(window.location.pathname);
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [open]);

  const handleNavigate = (href: string) => {
    setOpen(false);
    // Defer the navigation so the sheet's close animation can play
    // without the underlying route tearing down mid-frame.
    setTimeout(() => router.push(href), 80);
  };

  const Trigger = (
    <button
      type="button"
      aria-label={t("nav.menu")}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen(true)}
      className={cn(
        variant === "icon"
          // Icon variant: square hamburger button, matches the AddItemDialog
          // icon-only styling so they sit nicely next to each other.
          ? "md:hidden size-9 p-0 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
          // Tab variant: bottom-nav style, full width of its tab cell.
          : "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors min-w-0",
        className,
      )}
    >
      {variant === "icon" ? (
        <Menu className="size-5" aria-hidden />
      ) : (
        <>
          <MoreHorizontal className="size-5" aria-hidden />
          <span>{t("nav.more")}</span>
        </>
      )}
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {Trigger}
      <SheetContent
        side="right"
        className="w-[78vw] max-w-xs p-0 flex flex-col"
        showCloseButton={false}
      >
        <SheetHeader className="px-4 pt-5 pb-3">
          <SheetTitle className="text-base">{t("nav.menu")}</SheetTitle>
          {user && (
            <div className="flex items-center gap-2.5 mt-2 px-1">
              <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.full_name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
        </SheetHeader>
        <Separator />
        <nav className="flex-1 overflow-y-auto py-2">
          {MORE_ITEMS.map((item) => {
            const isActive = currentPath === item.href;
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => handleNavigate(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-accent",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{t(item.labelKey)}</span>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </nav>
        <Separator />
        <div className="p-3">
          <button
            type="button"
            onClick={() => { setOpen(false); setTimeout(() => logout(), 80); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-urgent hover:bg-urgent-bg/40 transition-colors"
          >
            <LogOut className="size-4 shrink-0" />
            {t("settings.logout")}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center px-4 pb-4">
          {t("app.name")} {t("app.version")}
        </p>
      </SheetContent>
    </Sheet>
  );
}
