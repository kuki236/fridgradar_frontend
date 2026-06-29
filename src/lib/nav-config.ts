import {
  House,
  Archive,
  ShoppingCart,
  Settings,
  History,
  ChefHat,
  CalendarClock,
  Inbox,
  ShieldAlert,
  MoreHorizontal,
  LogOut,
  type LucideIcon,
} from "lucide-react";

export type NavVariant = "sidebar" | "mobile" | "more";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /**
   * Where this item appears in the UI.
   * - `sidebar`  → desktop left rail
   * - `mobile`   → bottom nav (max 5 tabs)
   * - `more`     → the "Más" sheet on mobile (everything that doesn't fit
   *                in the bottom nav)
   */
  variant: NavVariant;
}

/**
 * Curated top-level navigation. The desktop sidebar shows everything; the
 * mobile bottom nav is limited to the five day-to-day actions, and a
 * "Más" sheet on the far right of the bottom nav collects the rest.
 *
 * Icons are deliberately distinct so two adjacent items can't be confused
 * (RF-NAV-002): "Alertas" uses a shield-with-exclamation while
 * "Notificaciones" keeps the inbox glyph. Previously both used a bell,
 * which the audit flagged as semantically muddy.
 */
export const navItems: NavItem[] = [
  { href: "/", labelKey: "nav.home", icon: House, variant: "mobile" },
  { href: "/inventory", labelKey: "nav.inventory", icon: Archive, variant: "mobile" },
  { href: "/shopping", labelKey: "nav.shopping", icon: ShoppingCart, variant: "mobile" },
  { href: "/recipes", labelKey: "nav.recipes", icon: ChefHat, variant: "mobile" },
  { href: "/expiry", labelKey: "nav.expiry", icon: CalendarClock, variant: "sidebar" },
  {
    href: "/alerts",
    labelKey: "nav.alerts",
    icon: ShieldAlert,
    variant: "sidebar",
  },
  {
    href: "/notifications",
    labelKey: "nav.notifications",
    icon: Inbox,
    variant: "sidebar",
  },
  { href: "/activity", labelKey: "nav.activity", icon: History, variant: "sidebar" },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, variant: "sidebar" },
];

/** Bottom-nav tabs (4 main + the "Más" trigger). Order matters — the last
 *  entry is the overflow sheet. */
export const MOBILE_TABS: NavItem[] = navItems.filter((i) => i.variant === "mobile");

/** Items shown inside the "Más" sheet. */
export const MORE_ITEMS: NavItem[] = navItems.filter((i) => i.variant === "sidebar");

/** The "Más" tab itself, used as the 5th entry in the bottom nav. */
export const MORE_TAB: NavItem = {
  href: "__more__",
  labelKey: "nav.more",
  icon: MoreHorizontal,
  variant: "mobile",
};

export const LOGOUT_ICON = LogOut;
