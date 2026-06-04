"use client";

import { Moon, Sun } from "lucide-react";
import { useDashboardTheme } from "@/components/dashboard/DashboardThemeProvider";

export function DashboardThemeToggle() {
  const { theme, toggleTheme } = useDashboardTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      aria-pressed={isLight}
      title={isLight ? "Modo claro" : "Modo oscuro"}
      className="dashboard-theme-toggle inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-brand-muted transition-colors hover:bg-white/10 hover:text-white"
    >
      {isLight ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
    </button>
  );
}
