import { apiRequest } from "@/lib/api";

export interface Alert {
  id: string;
  household_id: string;
  inventory_item_id: string | null;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string | null;
  due_at: string | null;
  read_at: string | null;
  resolved_at: string | null;
  created_at: string;
  product_name: string | null;
}

export const alertApi = {
  list: (householdId: string, severity?: string) => {
    const params = new URLSearchParams({ household_id: householdId });
    if (severity) params.set("severity", severity);
    return apiRequest<Alert[]>(`/api/alerts?${params}`);
  },

  markRead: (id: string) =>
    apiRequest<Alert>(`/api/alerts/${id}/read`, { method: "PATCH" }),

  snooze: (id: string) =>
    apiRequest<Alert>(`/api/alerts/${id}/snooze`, { method: "POST" }),

  runPreview: (householdId?: string) => {
    const params = householdId ? `?household_id=${householdId}` : "";
    return apiRequest<{ created: number; total_active: number }>(
      `/api/alerts/run-preview${params}`,
      { method: "POST" },
    );
  },
};
