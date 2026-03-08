import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type ThemeKey = "dark" | "light" | "pro-blue";

interface ThemeColors {
  bg: string;
  surface: string;
  card: string;
  border: string;
  accent: string;
  blue: string;
  warn: string;
  danger: string;
  success: string;
  text: string;
  muted: string;
}

const THEMES: Record<ThemeKey, ThemeColors> = {
  dark: {
    bg: "#070C16",
    surface: "#0C1220",
    card: "#111825",
    border: "#1A2438",
    accent: "#00D9A8",
    blue: "#4F83F7",
    warn: "#F59E0B",
    danger: "#EF4444",
    success: "#10B981",
    text: "#E2E8F0",
    muted: "#5A7090",
  },
  light: {
    bg: "#F8FAFC",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    border: "#E2E8F0",
    accent: "#0D9488",
    blue: "#3B82F6",
    warn: "#D97706",
    danger: "#DC2626",
    success: "#059669",
    text: "#1E293B",
    muted: "#64748B",
  },
  "pro-blue": {
    bg: "#0F172A",
    surface: "#1E293B",
    card: "#1E293B",
    border: "#334155",
    accent: "#38BDF8",
    blue: "#6366F1",
    warn: "#FBBF24",
    danger: "#F87171",
    success: "#34D399",
    text: "#F1F5F9",
    muted: "#94A3B8",
  },
};

export const THEME_LABELS: Record<ThemeKey, string> = {
  dark: "Sombre",
  light: "Clair",
  "pro-blue": "Pro Bleu",
};

interface ThemeCtx {
  theme: ThemeKey;
  colors: ThemeColors;
  setTheme: (t: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: "light",
  colors: THEMES.light,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>(() => {
    try {
      return (localStorage.getItem("apsi_theme") as ThemeKey) || "light";
    } catch {
      return "light";
    }
  });

  const colors = THEMES[theme];

  const setTheme = (t: ThemeKey) => {
    setThemeState(t);
    localStorage.setItem("apsi_theme", t);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-bg", colors.bg);
    root.style.setProperty("--color-surface", colors.surface);
    root.style.setProperty("--color-card", colors.card);
    root.style.setProperty("--color-border", colors.border);
    root.style.setProperty("--color-accent", colors.accent);
    root.style.setProperty("--color-blue", colors.blue);
    root.style.setProperty("--color-warn", colors.warn);
    root.style.setProperty("--color-danger", colors.danger);
    root.style.setProperty("--color-success", colors.success);
    root.style.setProperty("--color-text", colors.text);
    root.style.setProperty("--color-muted", colors.muted);
  }, [colors]);

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
