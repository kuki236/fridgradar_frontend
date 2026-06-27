import { apiRequest } from "@/lib/api";

export interface ProductSearchResult {
  name: string;
  category: string | null;
  image_url: string | null;
  barcode: string | null;
  brand: string | null;
}

export const productsApi = {
  search: (q: string) =>
    apiRequest<ProductSearchResult[]>(
      `/api/products/search?q=${encodeURIComponent(q)}`,
    ),
};
