"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Refrigerator, LogOut } from "lucide-react";
import { useTranslate } from "@/lib/i18n-context";
import { navItems } from "@/lib/nav-config";
import { useAuthStore } from "@/features/auth/infrastructure/auth.store";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslate();
  const { user, logout } = useAuthStore();

  return (
    <aside className="hidden md:flex flex-col w-60 h-dvh border-r bg-sidebar text-sidebar-foreground shrink-0 sticky top-0">
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-sidebar-border shrink-0">
        <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
          <Refrigerator className="size-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm tracking-tight">{t("app.name")}</span>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="size-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-3 border-t border-sidebar-border shrink-0 space-y-2">
        {user && (
          <div className="px-2 flex items-center gap-2.5 min-w-0">
            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-semibold text-primary">
                {user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user.full_name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-urgent-bg/40 hover:text-urgent transition-colors"
        >
          <LogOut className="size-3.5" />
          {t("settings.logout")}
        </button>
        <p className="text-[10px] text-muted-foreground px-2">
          {t("app.name")} {t("app.version")}
        </p>
      </div>
    </aside>
  );
}
