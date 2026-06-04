"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import StaffTable from "./components/StaffTable";
import StaffFormModal from "./components/StaffFormModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";

interface StaffMember {
  id: string;
  userId: string;
  name: string;
  role: "ADMIN" | "STAFF";
  branchId: string | null;
  createdAt: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Omit<StaffMember, "userId"> | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/team`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al cargar equipo");
      }
      const data: StaffMember[] = await res.json();
      setStaff(data);
      setTotal(data.length);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [page, limit]);

  const handleAddStaff = async (data: { email: string; name: string; role: string; branchId?: string }) => {
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, password: `temp_${Date.now()}` }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear miembro");
      }

      toast.success("Miembro agregado al equipo");
      setShowAddModal(false);
      fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const handleUpdateStaff = async (id: string, data: { role?: string; branchId?: string | null }) => {
    try {
      const res = await fetch(`/api/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al actualizar miembro");
      }

      toast.success("Miembro actualizado");
      fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    try {
      const res = await fetch(`/api/team/${selectedStaff.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al eliminar miembro");
      }

      toast.success("Miembro eliminado");
      setShowDeleteModal(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Equipo</h1>
          <p className="text-sm text-brand-muted mt-0.5">{total} miembro{total !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setSelectedStaff(null); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Agregar miembro
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <StaffTable
        staff={staff}
        loading={loading}
        onEdit={(member) => {
          setSelectedStaff(toSelectedStaff(member as StaffMember));
          setShowAddModal(true);
        }}
        onDelete={(member) => {
          setSelectedStaff(toSelectedStaff(member as StaffMember));
          setShowDeleteModal(true);
        }}
      />

      {total > limit && (
        <div className="flex items-center justify-between text-sm text-brand-muted">
          <span>Página {page} de {Math.ceil(total / limit)}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-white text-xs disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              Anterior
            </button>
            <button
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-white text-xs disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <StaffFormModal
          staff={selectedStaff}
          onSave={handleAddStaff}
          onUpdate={async (id, data) => { await handleUpdateStaff(id, data); setShowAddModal(false); setSelectedStaff(null); }}
          onClose={() => {
            setShowAddModal(false);
            setSelectedStaff(null);
          }}
        />
      )}

      {showDeleteModal && selectedStaff && (
        <DeleteConfirmModal
          name={selectedStaff.name}
          onConfirm={handleDeleteStaff}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedStaff(null);
          }}
        />
      )}
    </div>
  );
}

function toSelectedStaff(member: StaffMember): Omit<StaffMember, "userId"> {
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    branchId: member.branchId,
    createdAt: member.createdAt,
  };
}
