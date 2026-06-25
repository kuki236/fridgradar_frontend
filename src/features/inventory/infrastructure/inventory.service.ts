import { apiRequest } from "@/lib/api";

export interface InventoryItem {
  id: string;
  household_id: string;
  product_id: string;
  product_name: string;
  product_category: string | null;
  image_url: string | null;
  zone_id: string;
  zone_name: string;
  zone_type: string;
  refrigerator_name: string | null;
  refrigerator_type: string | null;
  quantity: number;
  unit: string | null;
  purchase_date: string | null;
  expiry_date: string | null;
  opened_date: string | null;
  status: string;
  created_at: string;
}

export interface CreateInventoryInput {
  household_id: string;
  product_name: string;
  product_category?: string;
  image_url?: string;
  zone_id: string;
  quantity?: number;
  unit?: string;
  purchase_date?: string;
  expiry_date?: string;
}

export const inventoryApi = {
  list: (householdId: string, zoneId?: string, status?: string) => {
    const params = new URLSearchParams({ household_id: householdId });
    if (zoneId) params.set("zone_id", zoneId);
    if (status) params.set("status", status);
    return apiRequest<InventoryItem[]>(`/api/inventory-items?${params}`);
  },

  get: (id: string) => apiRequest<InventoryItem>(`/api/inventory-items/${id}`),

  create: (data: CreateInventoryInput) =>
    apiRequest<InventoryItem>("/api/inventory-items", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    apiRequest<InventoryItem>(`/api/inventory-items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  consume: (id: string, quantity = 1) =>
    apiRequest<InventoryItem>(`/api/inventory-items/${id}/consume`, {
      method: "POST",
      body: JSON.stringify({ quantity }),
    }),

  discard: (id: string) =>
    apiRequest<InventoryItem>(`/api/inventory-items/${id}/discard`, {
      method: "POST",
    }),

  restock: (id: string, quantity = 1) =>
    apiRequest<InventoryItem>(`/api/inventory-items/${id}/restock`, {
      method: "POST",
      body: JSON.stringify({ quantity }),
    }),
};
