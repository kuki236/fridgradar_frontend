import { apiRequest } from "@/lib/api";

export interface ActivityEntry {
  id: string;
  household_id: string;
  actor_user_id: string;
  actor_name: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const activityApi = {
  list: (householdId: string, limit = 50) =>
    apiRequest<ActivityEntry[]>(
      `/api/activity?household_id=${householdId}&limit=${limit}`,
    ),
};
