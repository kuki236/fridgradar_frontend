import { apiRequest } from "@/lib/api";

export interface Household {
  id: string;
  name: string;
  timezone: string;
  owner_user_id: string;
  created_at: string;
}

export interface Member {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export interface CreateHouseholdInput {
  name: string;
  timezone?: string;
}

export const householdApi = {
  list: () => apiRequest<Household[]>("/api/households"),

  get: (id: string) => apiRequest<Household>(`/api/households/${id}`),

  create: (data: CreateHouseholdInput) =>
    apiRequest<Household>("/api/households", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateHouseholdInput>) =>
    apiRequest<Household>(`/api/households/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  invite: (householdId: string, email: string) =>
    apiRequest<Member>(`/api/households/${householdId}/invite`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  members: (householdId: string) =>
    apiRequest<Member[]>(`/api/households/${householdId}/members`),

  removeMember: (householdId: string, memberId: string) =>
    apiRequest<{ message: string }>(`/api/households/${householdId}/members/${memberId}`, {
      method: "DELETE",
    }),
};
