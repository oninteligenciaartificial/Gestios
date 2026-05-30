"use client";

import { useState, useEffect } from "react";
import { X, Shield, User } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  branchId?: string | null;
}

interface Props {
  staff: StaffMember | null;
  onSave: (data: { email: string; name: string; role: string; branchId?: string }) => Promise<void>;
  onUpdate: (id: string, data: { role?: string }) => Promise<void>;
  onClose: () => void;
}

const inp = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors text-sm";

export default function StaffFormModal({ staff, onSave, onUpdate, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("STAFF");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (staff) {
      setName(staff.name);
      setRole(staff.role);
      setEmail("");
    } else {
      setName("");
      setRole("STAFF");
      setEmail("");
    }
  }, [staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (staff) {
        // Edit mode — only update role
        await onUpdate(staff.id, { role });
      } else {
        // Create mode
        await onSave({ email, name, role });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-display font-bold text-white">
            {staff ? "Editar miembro" : "Agregar miembro"}
          </h2>
          <button onClick={onClose} className="text-brand-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!staff && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inp}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Nombre *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inp}
                  placeholder="Nombre completo"
                  required
                />
              </div>
            </>
          )}

          {staff && (
            <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-brand-muted mb-0.5">Miembro</p>
              <p className="text-sm font-medium text-white">{staff.name}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm text-brand-muted">Rol</label>
            <div className="grid grid-cols-2 gap-2">
              {(["STAFF", "ADMIN"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                    role === r
                      ? "bg-brand-kinetic-orange/15 border-brand-kinetic-orange/50 text-brand-kinetic-orange"
                      : "bg-white/5 border-white/10 text-brand-muted hover:text-white"
                  }`}
                >
                  {r === "ADMIN" ? <Shield size={14} /> : <User size={14} />}
                  {r === "ADMIN" ? "Administrador" : "Personal"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-brand-muted hover:text-white transition-colors text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-sm disabled:opacity-50"
            >
              {saving ? "Guardando..." : staff ? "Guardar cambios" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
