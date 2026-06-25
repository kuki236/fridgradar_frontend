export interface ThemePreset {
  name: string;
  primary: string;
  primaryForeground: string;
  background: string;
  sidebar: string;
  sidebarBorder: string;
}

export const themePresets: Record<string, ThemePreset> = {
  teal: {
    name: "Teal",
    primary: "oklch(0.45 0.11 190)",
    primaryForeground: "oklch(0.98 0 0)",
    background: "oklch(0.97 0.005 85)",
    sidebar: "oklch(0.99 0 0)",
    sidebarBorder: "oklch(0.88 0.005 85)",
  },
  blue: {
    name: "Blue",
    primary: "oklch(0.45 0.12 260)",
    primaryForeground: "oklch(0.98 0 0)",
    background: "oklch(0.97 0.005 260)",
    sidebar: "oklch(0.99 0 0)",
    sidebarBorder: "oklch(0.88 0.005 260)",
  },
  purple: {
    name: "Purple",
    primary: "oklch(0.45 0.14 290)",
    primaryForeground: "oklch(0.98 0 0)",
    background: "oklch(0.97 0.005 290)",
    sidebar: "oklch(0.99 0 0)",
    sidebarBorder: "oklch(0.88 0.005 290)",
  },
  green: {
    name: "Green",
    primary: "oklch(0.45 0.12 145)",
    primaryForeground: "oklch(0.98 0 0)",
    background: "oklch(0.97 0.005 120)",
    sidebar: "oklch(0.99 0 0)",
    sidebarBorder: "oklch(0.88 0.005 120)",
  },
  warm: {
    name: "Warm",
    primary: "oklch(0.5 0.12 60)",
    primaryForeground: "oklch(0.98 0 0)",
    background: "oklch(0.97 0.008 70)",
    sidebar: "oklch(0.99 0 0)",
    sidebarBorder: "oklch(0.88 0.005 70)",
  },
};
