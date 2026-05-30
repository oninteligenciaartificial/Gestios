"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface Props {
  name: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ name, onConfirm, onCancel }: Props) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertTriangle size={18} />
            </div>
            <h2 className="text-lg font-display font-bold text-white">Eliminar miembro</h2>
          </div>
          <button onClick={onCancel} className="text-brand-muted hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-brand-muted leading-relaxed">
          ¿Estás seguro que deseas eliminar a{" "}
          <span className="text-white font-medium">{name}</span>?
          Esta acción no se puede deshacer.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-brand-muted hover:text-white transition-colors text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors disabled:opacity-50"
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
