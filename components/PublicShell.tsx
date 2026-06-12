import type { ReactNode } from "react";

type PublicShellProps = {
  children: ReactNode;
  className?: string;
  tone?: "light" | "dark";
};

export function PublicShell({ children, className = "", tone = "dark" }: PublicShellProps) {
  return <div className={`public-${tone} min-h-screen ${className}`}>{children}</div>;
}
