import { apiRequest } from "@/lib/api";

export interface Invitation {
  id: string;
  member_id: string;
  household_name: string;
  inviter_name: string;
  status: string;
  created_at: string;
}

export const invitationsApi = {
  pending: () => apiRequest<Invitation[]>("/api/invitations/pending"),

  accept: (memberId: string) =>
    apiRequest<{ message: string }>(`/api/invitations/${memberId}/accept`, {
      method: "POST",
    }),

  reject: (memberId: string) =>
    apiRequest<{ message: string }>(`/api/invitations/${memberId}/reject`, {
      method: "POST",
    }),
};
