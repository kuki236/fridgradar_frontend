import { apiRequest } from "@/lib/api";

export interface Zone {
  id: string;
  household_id: string;
  name: string;
  type: "refrigerator" | "freezer" | "pantry" | "other";
  sort_order: number;
  refrigerator_id: string | null;
  created_at: string;
}

export interface CreateZoneInput {
  household_id: string;
  name: string;
  type: string;
  sort_order?: number;
  refrigerator_id?: string | null;
}

export const zoneApi = {
  list: (householdId: string) =>
    apiRequest<Zone[]>(`/api/zones?household_id=${householdId}`),

  create: (data: CreateZoneInput) =>
    apiRequest<Zone>("/api/zones", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateZoneInput>) =>
    apiRequest<Zone>(`/api/zones/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/api/zones/${id}`, {
      method: "DELETE",
    }),
};
