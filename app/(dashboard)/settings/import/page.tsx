"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, FileText, AlertTriangle, CheckCircle2, ArrowLeft,
  Download, Loader2, X, Package, Users,
} from "lucide-react";

type ImportType = "products" | "customers";
type Status = "idle" | "parsing" | "validated" | "importing" | "done" | "error";

interface RowError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  dry: boolean;
  parsed: number;
  imported: number;
  updated?: number;
  errors: RowError[];
}

const TEMPLATES: Record<ImportType, { headers: string; filename: string }> = {
  products: {
    headers: "nombre,precio,costo,stock,minstock,sku,barcode,categoria",
    filename: "plantilla_productos.csv",
  },
  customers: {
    headers: "nombre,telefono,email,direccion",
    filename: "plantilla_clientes.csv",
  },
};

function downloadTemplate(type: ImportType) {
  const { headers, filename } = TEMPLATES[type];
  const blob = new Blob([headers + "\n"], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<ImportType>("products");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);

  function reset() {
    setFile(null);
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleFile(f: File) {
    if (!f.name.endsWith(".csv")) {
      setErrorMsg("Solo se aceptan archivos .csv");
      return;
    }
    setFile(f);
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  async function runImport(dry: boolean) {
    if (!file) return;
    setStatus(dry ? "parsing" : "importing");
    setErrorMsg("");

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch(
        `/api/import/${importType}${dry ? "?dry=true" : ""}`,
        { method: "POST", body: fd }
      );
      const data = await res.json() as ImportResult & { error?: string };

      if (!res.ok) {
        setErrorMsg(data.error ?? "Error al importar");
        setStatus("error");
        return;
      }

      setResult(data);
      setStatus(dry ? "validated" : "done");
    } catch {
      setErrorMsg("Error de conexión");
      setStatus("error");
    }
  }

  const isLoading = status === "parsing" || status === "importing";
  const canValidate = !!file && status !== "done";
  const canImport = status === "validated" && result && result.errors.length < (result.parsed ?? 1);

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/settings")}
          className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-brand-muted hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Importar datos</h1>
          <p className="text-xs text-brand-muted">CSV — máx. 500 filas por importación</p>
        </div>
      </div>

      {/* Type selector */}
      <div className="glass-panel rounded-2xl p-4">
        <p className="text-xs font-medium text-brand-muted uppercase tracking-wider mb-3">¿Qué importar?</p>
        <div className="grid grid-cols-2 gap-2">
          {(["products", "customers"] as ImportType[]).map((t) => (
            <button
              key={t}
              onClick={() => { setImportType(t); reset(); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-sm font-medium ${
                importType === t
                  ? "bg-brand-kinetic-orange/10 border-brand-kinetic-orange/40 text-brand-kinetic-orange"
                  : "bg-white/5 border-white/10 text-brand-muted hover:text-white hover:bg-white/10"
              }`}
            >
              {t === "products" ? <Package size={16} /> : <Users size={16} />}
              {t === "products" ? "Productos" : "Clientes"}
            </button>
          ))}
        </div>
      </div>

      {/* Template download */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/8">
        <FileText size={15} className="text-brand-muted flex-shrink-0" />
        <span className="text-sm text-brand-muted flex-1">Descarga la plantilla CSV de ejemplo</span>
        <button
          onClick={() => downloadTemplate(importType)}
          className="flex items-center gap-1.5 text-xs text-brand-kinetic-orange hover:opacity-80 transition-opacity font-medium"
        >
          <Download size={13} /> Descargar
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !file && fileRef.current?.click()}
        className={`glass-panel rounded-2xl p-8 flex flex-col items-center gap-3 border-2 border-dashed transition-colors cursor-pointer ${
          dragging
            ? "border-brand-kinetic-orange/60 bg-brand-kinetic-orange/5"
            : file
            ? "border-white/20 cursor-default"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {file ? (
          <div className="flex items-center gap-3 w-full">
            <FileText size={20} className="text-brand-kinetic-orange flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{file.name}</p>
              <p className="text-xs text-brand-muted">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="text-brand-muted hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={28} className="text-brand-muted" />
            <p className="text-sm text-brand-muted text-center">
              Arrastra tu archivo <span className="text-white font-medium">.csv</span> aquí<br />
              o <span className="text-brand-kinetic-orange">haz clic para seleccionar</span>
            </p>
          </>
        )}
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle size={14} className="flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Validation result */}
      {result && (
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white">
              {result.dry ? "Vista previa" : "Resultado"}
            </span>
            <div className="flex items-center gap-3 text-xs text-brand-muted">
              <span className="text-brand-kinetic-orange font-medium">{result.parsed} filas leídas</span>
              {!result.dry && (
                <>
                  <span className="text-brand-growth-neon">{result.imported} importadas</span>
                  {(result.updated ?? 0) > 0 && (
                    <span className="text-blue-400">{result.updated} actualizadas</span>
                  )}
                </>
              )}
            </div>
          </div>

          {result.errors.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-brand-growth-neon">
              <CheckCircle2 size={14} />
              {result.dry ? "Sin errores — listo para importar" : "Importación completada sin errores"}
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs text-red-400 font-medium">{result.errors.length} error(es):</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {result.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs px-3 py-1.5 rounded-lg bg-red-500/8 border border-red-500/20">
                    <span className="text-red-400/60 flex-shrink-0 font-mono">F{e.row}</span>
                    <span className="text-red-300/70 flex-shrink-0">[{e.field}]</span>
                    <span className="text-red-300">{e.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => runImport(true)}
          disabled={!canValidate || isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-sm font-medium text-brand-muted hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30"
        >
          {status === "parsing" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Validar
        </button>
        <button
          onClick={() => runImport(false)}
          disabled={!canImport || isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-kinetic-orange text-black text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-30"
        >
          {status === "importing" ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Importar
        </button>
      </div>

      {status === "done" && (
        <p className="text-center text-xs text-brand-muted">
          ✓ Datos importados.{" "}
          <button
            onClick={reset}
            className="text-brand-kinetic-orange hover:underline"
          >
            Importar otro archivo
          </button>
        </p>
      )}
    </div>
  );
}
