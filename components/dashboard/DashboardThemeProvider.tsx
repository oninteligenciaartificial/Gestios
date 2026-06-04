"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type DashboardTheme = "dark" | "light";

type DashboardThemeContextValue = {
  theme: DashboardTheme;
  setTheme: (theme: DashboardTheme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "gestios-dashboard-theme";
const DashboardThemeContext = createContext<DashboardThemeContextValue | null>(null);

function readStoredTheme(): DashboardTheme {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
}

export function DashboardThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<DashboardTheme>(() => readStoredTheme());

  useEffect(() => {
    document.documentElement.dataset.dashboardTheme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo<DashboardThemeContextValue>(() => {
    function setTheme(nextTheme: DashboardTheme) {
      setThemeState(nextTheme);
    }

    function toggleTheme() {
      setThemeState((current) => (current === "dark" ? "light" : "dark"));
    }

    return { theme, setTheme, toggleTheme };
  }, [theme]);

  return <DashboardThemeContext.Provider value={value}>{children}</DashboardThemeContext.Provider>;
}

export function useDashboardTheme() {
  const context = useContext(DashboardThemeContext);
  if (!context) throw new Error("useDashboardTheme must be used inside DashboardThemeProvider");
  return context;
}
