export const BUSINESS_TYPES = [
  "GENERAL",
  "ROPA",
  "SUPLEMENTOS",
  "ELECTRONICA",
  "FARMACIA",
  "DENTAL",
  "FERRETERIA",
] as const;

export type BusinessType = typeof BUSINESS_TYPES[number];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  GENERAL:     "General",
  ROPA:        "Tienda de Ropa",
  SUPLEMENTOS: "Suplementos Deportivos",
  ELECTRONICA: "Electrónica",
  FARMACIA:    "Farmacia / Salud",
  DENTAL:       "Clinica Dental / Consultorio",
  FERRETERIA:  "Ferretería / Construcción",
};

// Empty array = freeform text input; non-empty = predefined dropdown options
export type AttributeSchema = Record<string, string[]>;

export const BUSINESS_TYPE_SCHEMAS: Record<BusinessType, AttributeSchema> = {
  GENERAL:     {},
  ROPA:        { talla: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"], color: [] },
  SUPLEMENTOS: { sabor: [], peso: ["1lb", "2lb", "5lb", "10lb", "15lb"] },
  ELECTRONICA: { capacidad: [], color: [] },
  FARMACIA:    { presentacion: ["Caja", "Frasco", "Blíster", "Ampolla", "Sobre"], dosis: [] },
  DENTAL:       { presentacion: ["Caja", "Frasco", "Unidad", "Kit", "Paquete"], area: ["Bioseguridad", "Operatoria", "Ortodoncia", "Endodoncia", "Limpieza"] },
  FERRETERIA:  { medida: [], material: [] },
};

export function getBusinessSchema(type: BusinessType): AttributeSchema {
  return BUSINESS_TYPE_SCHEMAS[type] ?? {};
}

export function hasVariantSupport(type: BusinessType): boolean {
  return Object.keys(BUSINESS_TYPE_SCHEMAS[type] ?? {}).length > 0;
}
