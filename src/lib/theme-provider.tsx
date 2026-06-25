"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { themePresets, type ThemePreset } from "@/lib/themes";

interface ThemeContextValue {
  theme: string;
  setTheme: (name: string) => void;
  currentPreset: ThemePreset;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState("teal");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved && themePresets[saved]) setThemeState(saved);
  }, []);

  const applyTheme = useCallback((name: string) => {
    const preset = themePresets[name];
    if (!preset) return;
    const root = document.documentElement;
    root.style.setProperty("--primary", preset.primary);
    root.style.setProperty("--primary-foreground", preset.primaryForeground);
    root.style.setProperty("--background", preset.background);
    root.style.setProperty("--sidebar", preset.sidebar);
    root.style.setProperty("--sidebar-border", preset.sidebarBorder);
    // Derived colors
    root.style.setProperty("--ring", preset.primary);
    root.style.setProperty("--sidebar-primary", preset.primary);
    root.style.setProperty("--sidebar-primary-foreground", preset.primaryForeground);
    root.style.setProperty("--accent", `color-mix(in oklch, ${preset.primary}, white 85%)`);
    root.style.setProperty("--muted", `color-mix(in oklch, ${preset.primary}, white 90%)`);
    root.style.setProperty("--border", `color-mix(in oklch, ${preset.primary}, white 80%)`);
    root.style.setProperty("--input", `color-mix(in oklch, ${preset.primary}, white 80%)`);
    root.style.setProperty("--chart-1", preset.primary);
    root.style.setProperty("--chart-2", `color-mix(in oklch, ${preset.primary}, white 40%)`);
    root.style.setProperty("--chart-3", `color-mix(in oklch, ${preset.primary}, white 60%)`);
    root.style.setProperty("--chart-4", `color-mix(in oklch, ${preset.primary}, black 20%)`);
    root.style.setProperty("--chart-5", `color-mix(in oklch, ${preset.primary}, black 40%)`);
  }, []);

  const setTheme = useCallback(
    (name: string) => {
      setThemeState(name);
      localStorage.setItem("theme", name);
      applyTheme(name);
    },
    [applyTheme],
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentPreset: themePresets[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
