"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslate } from "@/lib/i18n-context";
import { navItems } from "@/lib/nav-config";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslate();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t flex items-center justify-around h-16">
      {navItems
        .filter((item) => item.variant === "mobile" || item.variant === "both")
        .map((item) => {
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
              {t(item.labelKey)}
            </Link>
          );
        })}
    </nav>
  );
}
