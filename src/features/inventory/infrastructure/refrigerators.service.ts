import { apiRequest } from "@/lib/api";

export interface Refrigerator {
  id: string;
  household_id: string;
  name: string;
  type: "refrigerator" | "freezer" | "pantry" | "other";
  sort_order: number;
  created_at: string;
}

export interface CreateRefrigeratorInput {
  household_id: string;
  name: string;
  type: string;
  sort_order?: number;
}

export const refrigeratorApi = {
  list: (householdId: string) =>
    apiRequest<Refrigerator[]>(`/api/refrigerators?household_id=${householdId}`),

  create: (data: CreateRefrigeratorInput) =>
    apiRequest<Refrigerator>("/api/refrigerators", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateRefrigeratorInput>) =>
    apiRequest<Refrigerator>(`/api/refrigerators/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/api/refrigerators/${id}`, {
      method: "DELETE",
    }),
};
