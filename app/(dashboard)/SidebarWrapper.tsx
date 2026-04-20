"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "./SidebarNav";
import { SidebarUser } from "./SidebarUser";
import { PLAN_META, type PlanType } from "@/lib/plans";

interface NavLink { href: string; label: string }

interface Props {
  links: NavLink[];
  lockedHrefs: string[];
  orgName: string;
  isSuperAdmin: boolean;
  isImpersonating: boolean;
  name: string;
  email: string;
  role: string;
  plan: PlanType | null;
}

export function SidebarWrapper({ links, lockedHrefs, orgName, isSuperAdmin, isImpersonating, name, email, role, plan }: Props) {
  const [open, setOpen] = useState(false);

  const planMeta = plan ? PLAN_META[plan] : null;

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-[#0d0d0d] border border-white/10 text-white shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 border-r border-white/5 bg-[#0a0a0a] lg:bg-brand-surface-lowest/50
        p-6 flex flex-col gap-6 lg:gap-8
        transition-transform duration-300 lg:transition-none lg:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}
        overflow-y-auto
      `}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-display font-bold tracking-widest text-brand-kinetic-orange">
              GestiOS.
            </div>
            <div className={`text-xs mt-1 truncate ${
              isSuperAdmin
                ? "text-brand-kinetic-orange/70 font-medium"
                : isImpersonating
                ? "text-yellow-400/70"
                : "text-brand-muted"
            }`}>
              {orgName}
            </div>
          </div>
          <button
            className="lg:hidden text-brand-muted hover:text-white transition-colors mt-1"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <SidebarNav links={links} lockedHrefs={lockedHrefs} onNavigate={() => setOpen(false)} />

        {planMeta && (
          <div className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 ${planMeta.bg} border border-white/5`}>
            <span className={planMeta.color}>{planMeta.label}</span>
            <span className="text-brand-muted">{planMeta.price}</span>
          </div>
        )}

        <SidebarUser name={name} email={email} role={role} isSuperAdmin={isSuperAdmin} />
      </aside>
    </>
  );
}
