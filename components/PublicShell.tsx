import type { ReactNode } from "react";

type PublicShellProps = {
  children: ReactNode;
  className?: string;
};

export function PublicShell({ children, className = "" }: PublicShellProps) {
  return <div className={`public-light min-h-screen ${className}`}>{children}</div>;
}
