"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslate } from "@/lib/i18n-context";
import { MOBILE_TABS } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

/**
 * Bottom nav for phones.
 *
 * Layout: [Home] [Inventory] [Shopping] [Recipes]
 *
 * Only the four day-to-day actions live here. Everything else (Activity,
 * Alerts, Settings, Notifications, Expiry) is reachable from the
 * hamburger menu in each page's header (see `PageHeader` + `MoreMenu`).
 * This keeps every label fully visible on a 360px-wide screen and
 * stops the bar from clipping entries the way the previous 9-tab layout
 * did.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslate();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-lg border-t flex items-stretch justify-around h-16 pb-[env(safe-area-inset-bottom)]">
      {MOBILE_TABS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0 text-[10px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon
              className={cn("size-5", isActive && "fill-primary/20")}
              strokeWidth={isActive ? 2.25 : 2}
            />
            <span className="truncate max-w-[64px]">{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
