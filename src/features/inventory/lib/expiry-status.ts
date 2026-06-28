/**
 * Single source of truth for mapping the backend's `expiry_status` enum to the
 * badge status the UI uses. The backend values come from
 * `app.services.expiry_service.compute_expiry`:
 *
 *   None      -> item has no expiry_date
 *   "expired" -> expiry_date < today
 *   "today"   -> expiry_date == today
 *   "urgent"  -> 1..3 days left
 *   "attention" -> 4..7 days left
 *   "safe"    -> >7 days left
 *
 * The frontend collapses `today` into `urgent` (visually the same urgency)
 * and only renders an "expired" tone when the backend says so.
 */

export type ExpiryBadgeStatus = "safe" | "attention" | "urgent" | "expired";

export function toBadgeStatus(
  expiryStatus: string | null | undefined,
): ExpiryBadgeStatus {
  switch (expiryStatus) {
    case "expired":
      return "expired";
    case "today":
    case "urgent":
      return "urgent";
    case "attention":
      return "attention";
    case "safe":
    default:
      return "safe";
  }
}
