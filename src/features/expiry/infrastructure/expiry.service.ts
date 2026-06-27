import { apiRequest } from "@/lib/api";

export interface ExpiryItem {
  id: string;
  product_id: string;
  product_name: string;
  product_category: string | null;
  image_url: string | null;
  zone_id: string;
  zone_name: string;
  zone_type: string;
  refrigerator_name: string | null;
  quantity: number;
  unit: string | null;
  expiry_date: string | null;
  days_left: number | null;
  expiry_status: string | null;
  priority_score: number;
  is_low_stock: boolean;
}

export interface ExpirySummary {
  expired: number;
  today: number;
  this_week: number;
  this_month: number;
  later: number;
  no_date: number;
  total: number;
}

export interface ExpiryBuckets {
  expired: ExpiryItem[];
  today: ExpiryItem[];
  this_week: ExpiryItem[];
  this_month: ExpiryItem[];
  later: ExpiryItem[];
  no_date: ExpiryItem[];
}

export interface ExpiryTimelineDay {
  date: string;
  items: ExpiryItem[];
  count: number;
}

export interface ExpiryResponse {
  household_id: string;
  generated_at: string;
  range_start: string | null;
  range_end: string | null;
  summary: ExpirySummary;
  buckets: ExpiryBuckets;
  timeline: ExpiryTimelineDay[];
}

export const expiryApi = {
  get: (householdId: string, range?: { start: string; end: string }) => {
    const params = new URLSearchParams({ household_id: householdId });
    if (range) {
      params.set("start_date", range.start);
      params.set("end_date", range.end);
    }
    return apiRequest<ExpiryResponse>(`/api/expiry?${params.toString()}`);
  },
};
