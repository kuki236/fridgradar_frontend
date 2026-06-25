"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House, Archive, Bell, ShoppingCart, Settings, Refrigerator, History, ChefHat,
} from "lucide-react";
import { useTranslate } from "@/lib/i18n-context";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslate();

  const navItems = [
    { href: "/", label: t("nav.home"), icon: House },
    { href: "/inventory", label: t("nav.inventory"), icon: Archive },
    { href: "/recipes", label: t("nav.recipes"), icon: ChefHat },
    { href: "/alerts", label: t("nav.alerts"), icon: Bell },
    { href: "/notifications", label: t("nav.notifications"), icon: Bell },
    { href: "/shopping", label: t("nav.shopping"), icon: ShoppingCart },
    { href: "/activity", label: t("nav.activity"), icon: History },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

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
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-sidebar-border text-xs text-muted-foreground shrink-0">
        {t("app.name")} {t("app.version")}
      </div>
    </aside>
  );
}
