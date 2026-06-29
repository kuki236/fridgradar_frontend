"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { themePresets } from "@/lib/themes";

type ThemeName = keyof typeof themePresets;

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("teal");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved && themePresets[saved]) setThemeState(saved as ThemeName);
  }, []);

  const applyTheme = useCallback((name: string) => {
    if (!themePresets[name]) return;
    const preset = themePresets[name];
    const root = document.documentElement;
    root.style.setProperty("--primary", preset.primary);
    root.style.setProperty("--primary-foreground", preset.primaryForeground);
    root.style.setProperty("--background", preset.background);
    root.style.setProperty("--sidebar", preset.sidebar);
    root.style.setProperty("--sidebar-border", preset.sidebarBorder);
  }, []);

  const setTheme = useCallback(
    (name: string) => {
      if (!themePresets[name]) return;
      setThemeState(name as ThemeName);
      applyTheme(name);
      localStorage.setItem("theme", name);
    },
    [applyTheme],
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
