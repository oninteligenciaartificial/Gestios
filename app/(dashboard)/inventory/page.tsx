/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Search, Plus, Upload, Download } from "lucide-react";
import { getBusinessSchema, type BusinessType } from "@/lib/business-types";
import { getBusinessUI } from "@/lib/business-ui";
import { isPlanAtLeast, type PlanType } from "@/lib/plans";
import { ProductTable } from "./components/ProductTable";
import { ProductFormModal } from "./components/ProductFormModal";
import { StockEntryModal } from "./components/StockEntryModal";
import { StockHistoryModal } from "./components/StockHistoryModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import {
  type Category, type Product, type ProductVariant, type ProductForm, type VariantForm,
  EMPTY_FORM, EMPTY_VARIANT,
} from "./components/types";

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [businessType, setBusinessType] = useState<BusinessType>("GENERAL");
  const [activePlan, setActivePlan] = useState<PlanType>("BASICO");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [variantForm, setVariantForm] = useState<VariantForm>(EMPTY_VARIANT);
  const [variantAttrs, setVariantAttrs] = useState<Record<string, string>>({});
  const [savingVariant, setSavingVariant] = useState(false);
  const [variantError, setVariantError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stockEntry, setStockEntry] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [stockQty, setStockQty] = useState("1");
  const [stockSaving, setStockSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const openedEditParam = useRef<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"price" | "stock" | "deactivate" | "activate" | "">("");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [prodRes, catRes, meRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/categories"),
      fetch("/api/me"),
    ]);
    if (prodRes.ok) { const d = await prodRes.json(); setProducts(d.data ?? d); }
    if (catRes.ok) setCategories(await catRes.json());
    if (meRes.ok) {
      const me = await meRes.json();
      setBusinessType((me.organization?.businessType ?? "GENERAL") as BusinessType);
      setActivePlan((me.organization?.plan ?? "BASICO") as PlanType);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function fetchVariants(productId: string) {
    const res = await fetch(`/api/products/${productId}/variants`);
    if (res.ok) setVariants(await res.json());
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/products/import", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setImportMsg(`${data.created} productos importados.${data.errors.length ? ` ${data.errors.length} errores.` : ""}`);
      fetchData();
    } else {
      setImportMsg(data.error ?? "Error al importar");
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function downloadTemplate() {
    const csv = "nombre,precio,costo,stock,stock_minimo,sku,categoria\nEjemplo Producto,100,60,50,5,SKU001,Suplementos\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_productos.csv";
    a.click();
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setVariants([]);
    setShowVariants(false);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku ?? "",
      barcode: product.barcode ?? "",
      unit: product.unit ?? "",
      categoryId: product.category?.id ?? "",
      price: String(product.price),
      cost: String(product.cost),
      stock: String(product.stock),
      minStock: String(product.minStock),
      batchExpiry: product.batchExpiry ? product.batchExpiry.split("T")[0] : "",
      imageUrl: product.imageUrl ?? "",
      hasVariants: product.hasVariants,
    });
    setFormError("");
    setVariants(product.variants ?? []);
    setShowVariants(product.hasVariants);
    setShowModal(true);
  }

  useEffect(() => {
    const editProductId = new URLSearchParams(window.location.search).get("edit");
    if (!editProductId || loading || openedEditParam.current === editProductId) return;
    const product = products.find((item) => item.id === editProductId);
    if (!product) return;

    openedEditParam.current = editProductId;
    openEdit(product);
  }, [loading, products]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const schema = getBusinessSchema(businessType);
    const body = {
      name: form.name,
      sku: form.sku || undefined,
      barcode: form.barcode || undefined,
      unit: form.unit || undefined,
      categoryId: form.categoryId || undefined,
      price: parseFloat(form.price),
      cost: parseFloat(form.cost),
      stock: form.hasVariants ? 0 : parseInt(form.stock),
      minStock: parseInt(form.minStock),
      batchExpiry: form.batchExpiry || undefined,
      imageUrl: form.imageUrl || undefined,
      hasVariants: form.hasVariants,
      attributeSchema: form.hasVariants ? schema : undefined,
    };
    const res = editing
      ? await fetch(`/api/products/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      if (form.hasVariants) {
        const saved = await res.json();
        const productId = editing?.id ?? saved.id;
        await fetchVariants(productId);
        setEditing(prev => prev ? { ...prev, hasVariants: true } : { ...saved, hasVariants: true });
        setShowVariants(true);
        toast.success(editing ? "Producto actualizado" : "Producto creado");
        fetchData();
      } else {
        toast.success(editing ? "Producto actualizado" : "Producto creado");
        setShowModal(false);
        fetchData();
      }
    } else {
      const data = await res.json();
      setFormError(data.error ?? "Error al guardar");
    }
    setSaving(false);
  }

  async function handleAddVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSavingVariant(true);
    setVariantError("");
    const res = await fetch(`/api/products/${editing.id}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attributes: variantAttrs,
        sku: variantForm.sku || undefined,
        stock: parseInt(variantForm.stock) || 0,
        price: variantForm.price ? parseFloat(variantForm.price) : undefined,
      }),
    });
    if (res.ok) {
      await fetchVariants(editing.id);
      setVariantForm(EMPTY_VARIANT);
      setVariantAttrs({});
    } else {
      const d = await res.json();
      setVariantError(d.error ?? "Error al guardar variante");
    }
    setSavingVariant(false);
  }

  async function handleDeleteVariant(variantId: string) {
    if (!editing) return;
    await fetch(`/api/products/${editing.id}/variants?variantId=${variantId}`, { method: "DELETE" });
    await fetchVariants(editing.id);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    toast.success("Producto eliminado");
    setDeleteId(null);
    fetchData();
  }

  async function handleStockEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!stockEntry) return;
    setStockSaving(true);
    await fetch("/api/products/stock-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: stockEntry.id, quantity: Number(stockQty) }),
    });
    toast.success(`Stock actualizado (+${stockQty})`);
    setStockEntry(null);
    setStockQty("1");
    setStockSaving(false);
    fetchData();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/products/upload-image", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json() as { url: string };
      setForm((f) => ({ ...f, imageUrl: url }));
    } else {
      const { error } = await res.json() as { error: string };
      setFormError(error ?? "Error al subir imagen");
    }
    setUploadingImage(false);
  }

  function handleToggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleAll(ids: string[]) {
    setSelected((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      } else {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      }
    });
  }

  async function applyBulk() {
    if (!bulkAction) return;
    if ((bulkAction === "price" || bulkAction === "stock") && !bulkValue) return;
    setBulkLoading(true);
    const res = await fetch("/api/products/batch", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: [...selected],
        action: bulkAction,
        value: bulkValue ? parseFloat(bulkValue) : undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json() as { updated: number };
      toast.success(`${data.updated} producto(s) actualizados`);
      setSelected(new Set());
      setBulkAction("");
      setBulkValue("");
      fetchData();
    } else {
      const data = await res.json() as { error: string };
      toast.error(data.error ?? "Error al aplicar acción");
    }
    setBulkLoading(false);
  }

  const attrSchema = getBusinessSchema(businessType);
  const attrKeys = Object.keys(attrSchema);
  const ui = getBusinessUI(businessType);
  const canUseVariants = isPlanAtLeast(activePlan, "CRECER");

  const filtered = products
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5 md:space-y-8">
      <header className="animate-pop space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">{ui.pageTitle}</h1>
            <p className="text-brand-muted mt-1 text-sm">{ui.pageSubtitle}</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-4 md:px-6 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] text-sm md:text-base flex-shrink-0"
          >
            <Plus size={16} /> <span className="hidden sm:inline">{ui.newButtonLabel}</span><span className="sm:hidden">Nuevo</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} className="glass-panel px-3 py-2 rounded-full flex items-center gap-1.5 text-xs text-brand-muted hover:text-white transition-colors">
            <Download size={13} /> <span className="hidden sm:inline">Plantilla</span>
          </button>
          <label className={`px-3 py-2 rounded-full flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors ${importing ? "opacity-50 cursor-not-allowed" : "glass-panel text-brand-growth-neon hover:bg-white/10"}`}>
            <Upload size={13} />
            {importing ? "Importando..." : <><span className="hidden sm:inline">Importar CSV</span><span className="sm:hidden">Importar</span></>}
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <a
            href="/api/export/products"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-brand-muted hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            <Download size={14} /> Exportar CSV
          </a>
        </div>
      </header>

      {importMsg && (
        <div className={`px-4 py-3 rounded-xl text-sm ${importMsg.includes("Error") || importMsg.includes("error") ? "bg-red-500/10 text-red-400" : "bg-brand-growth-neon/10 text-brand-growth-neon"}`}>
          {importMsg}
        </div>
      )}

      <div className="relative animate-pop">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
        <input
          type="text"
          placeholder={ui.searchPlaceholder}
          className="w-full bg-brand-surface-highest/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-kinetic-orange transition-colors"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl bg-brand-kinetic-orange/10 border border-brand-kinetic-orange/20 animate-pop">
          <span className="text-sm font-medium text-brand-kinetic-orange">{selected.size} seleccionado(s)</span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as typeof bulkAction)}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white [&>option]:bg-white [&>option]:text-black"
          >
            <option value="">Acción...</option>
            <option value="price">Actualizar precio</option>
            <option value="stock">Ajustar stock</option>
            <option value="deactivate">Desactivar</option>
            <option value="activate">Activar</option>
          </select>
          {(bulkAction === "price" || bulkAction === "stock") && (
            <input
              type="number"
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              placeholder={bulkAction === "price" ? "Nuevo precio" : "Cantidad (+/-)"}
              className="w-32 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white"
            />
          )}
          <button
            onClick={applyBulk}
            disabled={!bulkAction || bulkLoading}
            className="px-3 py-1 rounded-lg bg-brand-kinetic-orange text-black text-sm font-bold disabled:opacity-40"
          >
            {bulkLoading ? "..." : "Aplicar"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-brand-muted hover:text-white text-sm"
          >
            Cancelar
          </button>
        </div>
      )}

      <ProductTable
        products={filtered}
        loading={loading}
        search={search}
        ui={ui}
        selected={selected}
        onToggle={handleToggle}
        onToggleAll={handleToggleAll}
        onEdit={openEdit}
        onDelete={setDeleteId}
        onStockEntry={(p) => { setStockEntry(p); setStockQty("1"); }}
        onViewHistory={(p) => setHistoryProduct(p)}
      />

      {showModal && (
        <ProductFormModal
          editing={!!editing}
          form={form}
          categories={categories}
          variants={variants}
          showVariants={showVariants}
          variantForm={variantForm}
          variantAttrs={variantAttrs}
          saving={saving}
          savingVariant={savingVariant}
          uploadingImage={uploadingImage}
          formError={formError}
          variantError={variantError}
          attrKeys={attrKeys}
          attrSchema={attrSchema}
          ui={ui}
          canUseVariants={canUseVariants}
          onFormChange={setForm}
          onSubmit={handleSave}
          onAddVariant={handleAddVariant}
          onDeleteVariant={handleDeleteVariant}
          onVariantFormChange={setVariantForm}
          onVariantAttrsChange={setVariantAttrs}
          onShowVariantsToggle={() => setShowVariants(!showVariants)}
          onImageUpload={handleImageUpload}
          onClose={() => setShowModal(false)}
        />
      )}

      {stockEntry && (
        <StockEntryModal
          product={stockEntry}
          qty={stockQty}
          saving={stockSaving}
          onQtyChange={setStockQty}
          onSubmit={handleStockEntry}
          onClose={() => setStockEntry(null)}
        />
      )}

      {historyProduct && (
        <StockHistoryModal
          productId={historyProduct.id}
          productName={historyProduct.name}
          open={!!historyProduct}
          onClose={() => setHistoryProduct(null)}
        />
      )}

      {deleteId && (
        <DeleteConfirmModal
          productSingular={ui.productSingular}
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
