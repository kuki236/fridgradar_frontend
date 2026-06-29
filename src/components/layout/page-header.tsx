"use client";

import type { ReactNode } from "react";
import { MoreMenu } from "./more-menu";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Big page title shown next to the hamburger on mobile. */
  title: string;
  /** Optional subtitle (typically the active household name on the
   *  dashboard, or a "X remaining" counter on shopping). Hidden on
   *  mobile to keep the header one line tall. */
  subtitle?: ReactNode;
  /** Right-side actions (e.g. the "+ Agregar" button). The cell is
   *  shrink-0 so the title can ellipsize cleanly on narrow screens. */
  actions?: ReactNode;
  /** Extra class for the outer flex container. */
  className?: string;
}

/**
 * Standard page header used by every mobile-aware page.
 *
 * Layout: [☰]  Title                [actions]
 *
 * On mobile this puts the hamburger button to the LEFT of the title
 * (per the audit's recommendation) and the action button on the right.
 * On `md+` the hamburger disappears and the layout still works because
 * the desktop sidebar is doing the navigation.
 */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MoreMenu variant="icon" />
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="hidden sm:block text-sm text-muted-foreground mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
