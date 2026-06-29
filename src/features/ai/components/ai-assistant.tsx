"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Bot, ChefHat, ShoppingCart, Salad, Calendar } from "lucide-react";
import { aiApi, type ChatMessage } from "@/features/ai/infrastructure/ai.service";
import { useTranslate } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { key: "cook", icon: ChefHat },
  { key: "meal_plan", icon: Calendar },
  { key: "shopping_recos", icon: ShoppingCart },
  { key: "nutrition", icon: Salad },
] as const;

export function AIAssistant() {
  const { t } = useTranslate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (content: string) => {
    if (!content.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: content.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const res = await aiApi.chat(updated);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: t("ai.error") }]);
    }
    setLoading(false);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-[5.25rem] right-4 md:bottom-24 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl bg-card shadow-dropdown ring-1 ring-foreground/10 flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="size-4 text-primary" />
              </div>
              <span className="text-sm font-medium">{t("ai.title")}</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-80 p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <Bot className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">{t("ai.placeholder")}</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2 max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "",
                )}
              >
                <div
                  className={cn(
                    "size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    msg.role === "user"
                      ? "bg-primary/10"
                      : "bg-muted",
                  )}
                >
                  {msg.role === "user" ? (
                    <span className="text-[10px] font-semibold text-primary">U</span>
                  ) : (
                    <Bot className="size-3.5 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted",
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 max-w-[85%]">
                <div className="size-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="size-3.5 text-muted-foreground" />
                </div>
                <div className="rounded-xl px-3 py-2 bg-muted">
                  <span className="text-sm text-muted-foreground animate-pulse">{t("ai.thinking")}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 0 && (
            <div className="px-4 pb-3">
              <div className="grid grid-cols-2 gap-1.5">
                {SUGGESTIONS.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => handleSend(t(`ai.suggestions.${key}`))}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{t(`ai.suggestions.${key}`)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 border-t">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                placeholder={t("ai.placeholder")}
                className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none transition-colors"
              />
              <Button
                size="icon"
                onClick={() => handleSend(input)}
                disabled={loading || !input.trim()}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        // The FAB sits 1rem (16px) above the 64px bottom nav on mobile so it
        // never collides with the last tab. On desktop it anchors to the
        // corner as before. The audit flagged the previous `bottom-4` as
        // physically overlapping the bottom-nav's last icon on phones.
        className={cn(
          "fixed right-4 z-50 size-11 rounded-full flex items-center justify-center shadow-dropdown transition-all duration-200",
          "bottom-[5rem] md:bottom-6",
          open
            ? "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground ring-1 ring-foreground/10"
            : "bg-primary text-primary-foreground hover:bg-primary/80",
        )}
      >
        {open ? <X className="size-5" /> : <Sparkles className="size-5" />}
      </button>
    </>
  );
}
