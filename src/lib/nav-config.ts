import {
  House,
  Archive,
  Bell,
  ShoppingCart,
  Settings,
  History,
  ChefHat,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";

export type NavVariant = "sidebar" | "mobile" | "both";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  variant: NavVariant;
}

export const navItems: NavItem[] = [
  { href: "/", labelKey: "nav.home", icon: House, variant: "both" },
  { href: "/inventory", labelKey: "nav.inventory", icon: Archive, variant: "both" },
  { href: "/expiry", labelKey: "nav.expiry", icon: CalendarClock, variant: "both" },
  { href: "/recipes", labelKey: "nav.recipes", icon: ChefHat, variant: "both" },
  { href: "/alerts", labelKey: "nav.alerts", icon: Bell, variant: "both" },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell, variant: "sidebar" },
  { href: "/shopping", labelKey: "nav.shopping", icon: ShoppingCart, variant: "both" },
  { href: "/activity", labelKey: "nav.activity", icon: History, variant: "sidebar" },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, variant: "both" },
];
