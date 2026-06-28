import { apiRequest } from "@/lib/api";

export type InventoryItemStatus = "active" | "consumed" | "discarded" | "archived";

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
  refrigerator_id: string | null;
  quantity: number;
  unit: string | null;
  low_stock_threshold: number | null;
  is_low_stock: boolean;
  expiry_status: string | null;
  days_left: number | null;
  priority_score: number;
  purchase_date: string | null;
  expiry_date: string | null;
  opened_date: string | null;
  status: InventoryItemStatus;
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
  low_stock_threshold?: number;
}

export const inventoryApi = {
  list: async (householdId: string, zoneId?: string, status?: string) => {
    // NOTE: the optional `zoneId` is the inventory item's ZONE id, not a
    // refrigerator id. Pass `refrigerator_id` to filter by fridge? The
    // backend doesn't support that today, so clients that need a fridge
    // filter should fetch the full household and filter client-side using
    // `item.refrigerator_id`.
    const params = new URLSearchParams({ household_id: householdId });
    if (zoneId) params.set("zone_id", zoneId);
    if (status) params.set("status", status);
    const data = await apiRequest<{
      items: InventoryItem[];
      total: number;
      limit: number;
      offset: number;
    }>(`/api/inventory-items?${params}`);
    return data.items;
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
