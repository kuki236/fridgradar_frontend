import type { Alert } from "../infrastructure/alerts.service";

type Translator = (
  key: string,
  params?: Record<string, string | number>,
) => string;

/**
 * Format an alert title in the active UI locale (RF-COM-003).
 *
 * The backend ships a clean English fallback in `alert.title`, but the
 * dashboard is fully Spanish in the default UI. Re-using the backend string
 * would surface "expiring in 4 day(s)" while everything around it is in
 * Spanish. Instead, we render the title client-side from the structured
 * fields (`type`, `product_name`, `days_left`) so every locale gets a
 * properly-pluralized phrase and we never show the awkward "(s)" hack.
 */
export function formatAlertTitle(
  alert: Alert,
  t: Translator,
  productName?: string | null,
): string {
  const name = productName ?? alert.product_name ?? "";

  switch (alert.type) {
    case "expired": {
      const n = Math.abs(alert.days_left ?? 0);
      const phrase = t(n === 1 ? "home.expired_ago" : "home.expired_ago_plural", { n });
      return name ? `${name} — ${phrase}` : phrase;
    }
    case "expiring_today": {
      const phrase = t("home.expiring_today");
      return name ? `${name} — ${phrase}` : phrase;
    }
    case "expiring_soon": {
      const n = Math.abs(alert.days_left ?? 0);
      const phrase =
        n === 1
          ? t("home.expiring_in", { n })
          : t("home.expiring_in_plural", { n });
      return name ? `${name} — ${phrase}` : phrase;
    }
    case "low_stock": {
      // Backend already returns a clean English title; the dashboard only
      // shows this on the alerts page, not on home, but keep the helper
      // complete.
      return alert.title;
    }
    default:
      return alert.title;
  }
}
