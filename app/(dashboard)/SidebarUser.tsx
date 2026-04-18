"use client";

import { useState } from "react";
import { LogOut, Settings, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Props {
  name: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
}

export function SidebarUser({ name, email, role, isSuperAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mt-auto relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 rounded-xl border border-white/10 text-left hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="font-medium text-white truncate text-sm">{name}</div>
            <div className="text-xs text-brand-muted truncate">{email}</div>
            <div className={`text-xs mt-0.5 font-bold ${isSuperAdmin ? "text-brand-kinetic-orange" : "text-brand-muted/60"}`}>
              {role}
            </div>
          </div>
          <ChevronUp size={14} className={`text-brand-muted transition-transform flex-shrink-0 ml-2 ${open ? "" : "rotate-180"}`} />
        </div>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 glass-panel rounded-xl overflow-hidden border border-white/10">
          <a
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 text-sm text-brand-muted hover:bg-white/5 hover:text-white transition-colors"
            onClick={() => setOpen(false)}
          >
            <Settings size={15} />
            Configuracion
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={15} />
            Cerrar Sesion
          </button>
        </div>
      )}
    </div>
  );
}
