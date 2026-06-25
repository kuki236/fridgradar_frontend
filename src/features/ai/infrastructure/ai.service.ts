import { apiRequest } from "@/lib/api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const aiApi = {
  chat: (messages: ChatMessage[], context?: Record<string, unknown>) =>
    apiRequest<{ reply: string }>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages, context }),
    }),
};
