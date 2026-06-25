import { apiRequest } from "@/lib/api";

export interface ShoppingItem {
  id: string;
  household_id: string;
  product_name: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
  source: string | null;
  created_at: string;
}

export const shoppingApi = {
  getCurrent: (householdId: string) =>
    apiRequest<ShoppingItem[]>(
      `/api/shopping-lists/current?household_id=${householdId}`,
    ),

  add: (householdId: string, productName: string, quantity?: number, unit?: string) =>
    apiRequest<ShoppingItem>("/api/shopping-lists/items", {
      method: "POST",
      body: JSON.stringify({
        household_id: householdId,
        product_name: productName,
        quantity: quantity || null,
        unit: unit || null,
      }),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    apiRequest<ShoppingItem>(`/api/shopping-lists/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/api/shopping-lists/items/${id}`, {
      method: "DELETE",
    }),
};
