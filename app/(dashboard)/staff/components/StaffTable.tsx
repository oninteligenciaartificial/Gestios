"use client";

import { Trash2, Pencil, Shield, User } from "lucide-react";

interface StaffMember {
  id: string;
  userId: string;
  name: string;
  role: "ADMIN" | "STAFF";
  branchId: string | null;
  createdAt: string;
}

interface Props {
  staff: StaffMember[];
  loading: boolean;
  onEdit: (member: StaffMember) => void;
  onDelete: (member: StaffMember) => void;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  STAFF: "Personal",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-brand-kinetic-orange/15 text-brand-kinetic-orange border border-brand-kinetic-orange/30",
  STAFF: "bg-white/5 text-brand-muted border border-white/10",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function StaffTable({ staff, loading, onEdit, onDelete }: Props) {
  if (loading && staff.length === 0) {
    return <div className="text-center py-12 text-brand-muted text-sm">Cargando equipo...</div>;
  }

  if (!staff.length) {
    return (
      <div className="text-center py-12 text-brand-muted">
        <User size={36} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm">No hay miembros del equipo. Agrega el primero.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-brand-muted">Miembro</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-brand-muted">Rol</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-brand-muted">Ingreso</th>
              <th className="text-right px-5 py-3.5 text-xs font-medium text-brand-muted">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-kinetic-orange/20 border border-brand-kinetic-orange/30 flex items-center justify-center text-sm font-bold text-brand-kinetic-orange flex-shrink-0">
                      {initials(member.name)}
                    </div>
                    <span className="text-sm font-medium text-white">{member.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[member.role] ?? roleColors.STAFF}`}>
                    {member.role === "ADMIN" ? <Shield size={10} /> : <User size={10} />}
                    {roleLabels[member.role] ?? member.role}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs text-brand-muted">
                    {new Date(member.createdAt).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(member)}
                      className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-muted hover:text-white hover:bg-white/10 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => onDelete(member)}
                      className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-white/[0.04]">
        {staff.map((member) => (
          <div key={member.id} className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-kinetic-orange/20 border border-brand-kinetic-orange/30 flex items-center justify-center text-sm font-bold text-brand-kinetic-orange flex-shrink-0">
              {initials(member.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{member.name}</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${roleColors[member.role] ?? roleColors.STAFF}`}>
                {member.role === "ADMIN" ? <Shield size={9} /> : <User size={9} />}
                {roleLabels[member.role] ?? member.role}
              </span>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => onEdit(member)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-muted hover:text-white transition-colors"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => onDelete(member)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-muted hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
