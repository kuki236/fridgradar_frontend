"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Refrigerator, Loader2 } from "lucide-react";
import { useAuthStore } from "@/features/auth/infrastructure/auth.store";
import { useTranslate } from "@/lib/i18n-context";

export default function RegisterPage() {
  const { t } = useTranslate();
  const router = useRouter();
  const { register, isLoading, error } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(email, password, name);
      router.push("/");
    } catch {}
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="size-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Refrigerator className="size-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{t("app.name")}</h1>
          <p className="text-sm text-muted-foreground">{t("auth.create_account_title")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-urgent-bg text-urgent text-sm px-3 py-2">{error}</div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">{t("auth.full_name")}</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none transition-colors"
              placeholder={t("auth.name_placeholder")}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">{t("auth.email")}</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none transition-colors"
              placeholder={t("auth.email_placeholder")}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">{t("auth.password")}</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none transition-colors"
              placeholder={t("auth.password_placeholder")}
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors disabled:opacity-50"
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {isLoading ? t("auth.creating") : t("auth.create_btn")}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.have_account")}{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t("auth.sign_in_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
