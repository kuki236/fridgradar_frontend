"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Archive, Bell, ShoppingCart, Settings, BellRing, ChefHat } from "lucide-react";
import { useTranslate } from "@/lib/i18n-context";

const navItems = [
  { href: "/", key: "home", icon: House },
  { href: "/inventory", key: "inventory", icon: Archive },
  { href: "/recipes", key: "recipes", icon: ChefHat },
  { href: "/alerts", key: "alerts", icon: Bell },
  { href: "/notifications", key: "notifications", icon: BellRing },
  { href: "/shopping", key: "shopping", icon: ShoppingCart },
  { href: "/settings", key: "settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslate();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t flex items-center justify-around h-16">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className={`size-5 ${isActive ? "fill-primary/20" : ""}`} />
            {t(`nav.${item.key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
