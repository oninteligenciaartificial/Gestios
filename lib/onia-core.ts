export const ONIA_CORE_NAME = "ONIA Core";

export const ONIA_CORE_IMPLEMENTATION_REPO = "GestiOS";

export const ONIA_CORE_QUESTIONS = [
  {
    id: "people",
    question: "Quien trabaja en la empresa?",
  },
  {
    id: "roles",
    question: "Que rol y permisos tiene cada persona?",
  },
  {
    id: "relationships",
    question: "Que clientes, proveedores, contactos o areas existen?",
  },
  {
    id: "open_work",
    question: "Que tareas, solicitudes, casos o pendientes estan abiertos?",
  },
  {
    id: "ownership",
    question: "Quien es responsable?",
  },
  {
    id: "status",
    question: "En que estado esta cada pendiente?",
  },
  {
    id: "next_action",
    question: "Cual es la fecha limite o siguiente accion?",
  },
  {
    id: "evidence",
    question: "Que evidencia, nota, archivo o historial existe?",
  },
  {
    id: "attention",
    question: "Que alerta requiere atencion?",
  },
  {
    id: "management",
    question: "Que reporte necesita gerencia?",
  },
] as const;

export type OniaCoreQuestionId = (typeof ONIA_CORE_QUESTIONS)[number]["id"];

export type OniaCapabilityLayer =
  | "core"
  | "activatable_module"
  | "vertical_extension"
  | "external_gate";

export type OniaImplementationPhase = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface OniaCapabilityDefinition {
  id: string;
  name: string;
  layer: OniaCapabilityLayer;
  phase: OniaImplementationPhase;
  summary: string;
  answers: readonly OniaCoreQuestionId[];
  existingSurfaces: readonly string[];
  blockedUntil?: string;
}
export const ONIA_CAPABILITIES = [
  {
    id: "tenant",
    name: "Tenant y organizacion",
    layer: "core",
    phase: 0,
    summary: "Aisla cada empresa y define la unidad basica de operacion.",
    answers: ["people", "roles", "relationships"],
    existingSurfaces: ["Organization", "Profile", "organizationId", "getTenantProfile"],
  },
  {
    id: "team_roles",
    name: "Equipo, roles y permisos",
    layer: "core",
    phase: 1,
    summary: "Define quien trabaja, que puede hacer y que areas puede operar.",
    answers: ["people", "roles", "ownership"],
    existingSurfaces: ["Role", "Profile", "lib/permissions.ts", "app/api/team"],
  },
  {
    id: "relationships",
    name: "Clientes, proveedores, contactos y areas",
    layer: "core",
    phase: 2,
    summary: "Ordena las personas, empresas y areas con las que opera el negocio.",
    answers: ["relationships", "ownership"],
    existingSurfaces: ["Customer", "Supplier", "Branch"],
  },
  {
    id: "work_items",
    name: "Tareas, solicitudes, casos y pendientes",
    layer: "core",
    phase: 2,
    summary: "Convierte trabajo disperso en pendientes con responsable, estado y siguiente accion.",
    answers: ["open_work", "ownership", "status", "next_action"],
    existingSurfaces: ["Order", "PurchaseOrder", "Notification", "ActivityLog"],
  },
  {
    id: "evidence_activity",
    name: "Evidencia, actividad y auditoria",
    layer: "core",
    phase: 2,
    summary: "Registra que paso, quien lo hizo y que evidencia respalda el avance.",
    answers: ["evidence", "status", "management"],
    existingSurfaces: ["ActivityLog", "AuditLog", "UserSession"],
  },
  {
    id: "alerts_reports",
    name: "Alertas y reportes gerenciales",
    layer: "core",
    phase: 2,
    summary: "Muestra lo que requiere atencion y lo que gerencia necesita decidir.",
    answers: ["attention", "management"],
    existingSurfaces: ["Notification", "reports routes", "dashboard route"],
  },
  {
    id: "data_ops",
    name: "Importacion, exportacion y validacion",
    layer: "core",
    phase: 2,
    summary: "Permite cargar, revisar y sacar informacion sin depender de integraciones profundas.",
    answers: ["relationships", "open_work", "evidence"],
    existingSurfaces: ["CSV helpers", "import routes", "export routes"],
  },
  {
    id: "catalog_inventory",
    name: "Catalogo, productos e inventario",
    layer: "activatable_module",
    phase: 3,
    summary: "Modulo para rubros que necesitan productos, variantes, stock y reposicion.",
    answers: ["relationships", "attention", "management"],
    existingSurfaces: ["Category", "Product", "ProductVariant", "InventoryMovement"],
  },
  {
    id: "sales_cash",
    name: "Ventas, pedidos y caja",
    layer: "activatable_module",
    phase: 3,
    summary: "Modulo comercial para negocios que registran pedidos, ventas o caja diaria.",
    answers: ["open_work", "status", "management"],
    existingSurfaces: ["Order", "OrderItem", "CashRegister", "PaymentRequest"],
  },
  {
    id: "purchases",
    name: "Compras y reposicion",
    layer: "activatable_module",
    phase: 3,
    summary: "Modulo para proveedores, ordenes de compra y continuidad de stock.",
    answers: ["open_work", "ownership", "attention"],
    existingSurfaces: ["Supplier", "PurchaseOrder", "PurchaseOrderItem"],
  },
  {
    id: "quotes_b2b",
    name: "Cotizaciones B2B",
    layer: "vertical_extension",
    phase: 4,
    summary: "Extension para importadoras, mayoristas y distribuidoras que venden por solicitud.",
    answers: ["open_work", "ownership", "status", "next_action"],
    existingSurfaces: [],
  },
  {
    id: "knowledge_base",
    name: "Base de conocimiento interna",
    layer: "vertical_extension",
    phase: 4,
    summary: "Base de respuestas, procesos, productos y criterio comercial antes de activar chatbots.",
    answers: ["evidence", "next_action", "management"],
    existingSurfaces: [],
  },
  {
    id: "whatsapp",
    name: "WhatsApp automatico",
    layer: "external_gate",
    phase: 5,
    summary: "Conector externo, no parte del precio base ni del core inicial.",
    answers: ["next_action", "attention"],
    existingSurfaces: ["OrgAddon", "WaConversation"],
    blockedUntil: "Meta/proveedor validado, credenciales, precio y soporte definidos",
  },
  {
    id: "tr4_adapter",
    name: "TR4 adapter",
    layer: "external_gate",
    phase: 5,
    summary: "Adaptador especifico para clientes con TR4; empieza read-only o dry-run.",
    answers: ["evidence", "management"],
    existingSurfaces: [],
    blockedUntil: "Discovery pagado, permiso del cliente, entorno de prueba y rollback",
  },
  {
    id: "siat",
    name: "SIAT/facturacion fiscal",
    layer: "external_gate",
    phase: 5,
    summary: "Capacidad externa retirada del alcance comercial hasta tener proveedor y margen.",
    answers: ["management"],
    existingSurfaces: ["lib/siat.ts"],
    blockedUntil: "Proveedor validado, soporte fiscal y margen comercial aprobados",
  },
] as const satisfies readonly OniaCapabilityDefinition[];

export type OniaCapabilityId = (typeof ONIA_CAPABILITIES)[number]["id"];

export type OniaFamilyId =
  | "ONIA_CORE"
  | "GESTIOS"
  | "PROVEEGEST"
  | "DENTALGEST"
  | "HATOGEST";

export interface OniaFamilyDefinition {
  id: OniaFamilyId;
  name: string;
  role: string;
  coreRelationship: "core" | "implementation" | "vertical" | "separate_vertical";
}

export const ONIA_FAMILIES = [
  {
    id: "ONIA_CORE",
    name: "ONIA Core",
    role: "Nucleo de organizacion operativa de empresas.",
    coreRelationship: "core",
  },
  {
    id: "GESTIOS",
    name: "GestiOS",
    role: "Primera implementacion cliente de ONIA Core.",
    coreRelationship: "implementation",
  },
  {
    id: "PROVEEGEST",
    name: "ProveeGest",
    role: "Vertical B2B para importadoras, mayoristas y distribuidoras.",
    coreRelationship: "vertical",
  },
  {
    id: "DENTALGEST",
    name: "DentalGest",
    role: "Vertical clinico dental separado; comparte patrones, no dominio clinico.",
    coreRelationship: "separate_vertical",
  },
  {
    id: "HATOGEST",
    name: "HatoGest / Ganadero OS",
    role: "Vertical rural/offline separado por dominio y conectividad.",
    coreRelationship: "separate_vertical",
  },
] as const satisfies readonly OniaFamilyDefinition[];

export type OniaVerticalTrackStatus = "active" | "planned" | "blocked";

export interface OniaVerticalTrack {
  id: string;
  familyId: OniaFamilyId;
  name: string;
  status: OniaVerticalTrackStatus;
  businessType?: string;
  requiredCapabilityIds: readonly OniaCapabilityId[];
  blockedCapabilityIds: readonly OniaCapabilityId[];
}

export const ONIA_VERTICAL_TRACKS = [
  {
    id: "gestios-general",
    familyId: "GESTIOS",
    name: "GestiOS General",
    status: "active",
    businessType: "GENERAL",
    requiredCapabilityIds: [
      "tenant",
      "team_roles",
      "relationships",
      "work_items",
      "evidence_activity",
      "alerts_reports",
      "data_ops",
    ],
    blockedCapabilityIds: ["whatsapp", "siat"],
  },
  {
    id: "proveegest-electrico",
    familyId: "PROVEEGEST",
    name: "ProveeGest Electrico",
    status: "planned",
    businessType: "ELECTRICO",
    requiredCapabilityIds: [
      "tenant",
      "team_roles",
      "relationships",
      "work_items",
      "evidence_activity",
      "alerts_reports",
      "data_ops",
      "catalog_inventory",
      "quotes_b2b",
      "knowledge_base",
    ],
    blockedCapabilityIds: ["whatsapp", "tr4_adapter", "siat"],
  },
  {
    id: "dentagest",
    familyId: "DENTALGEST",
    name: "DentalGest",
    status: "active",
    businessType: "DENTAL",
    requiredCapabilityIds: ["tenant", "team_roles", "evidence_activity", "alerts_reports"],
    blockedCapabilityIds: ["siat"],
  },
  {
    id: "hatogest",
    familyId: "HATOGEST",
    name: "HatoGest / Ganadero OS",
    status: "planned",
    businessType: "GANADERO",
    requiredCapabilityIds: ["tenant", "team_roles", "evidence_activity", "alerts_reports"],
    blockedCapabilityIds: ["whatsapp", "siat"],
  },
] as const satisfies readonly OniaVerticalTrack[];

export function getOniaCapabilitiesByLayer(layer: OniaCapabilityLayer): OniaCapabilityDefinition[] {
  return ONIA_CAPABILITIES.filter((capability) => capability.layer === layer);
}

export function getOniaCapability(id: string): OniaCapabilityDefinition | undefined {
  return ONIA_CAPABILITIES.find((capability) => capability.id === id);
}

export function isOniaCoreCapability(id: string): boolean {
  return getOniaCapability(id)?.layer === "core";
}

export function getOniaVerticalTrack(id: string): OniaVerticalTrack | undefined {
  return ONIA_VERTICAL_TRACKS.find((track) => track.id === id);
}

export function getBlockedCapabilitiesForTrack(trackId: string): OniaCapabilityDefinition[] {
  const track = getOniaVerticalTrack(trackId);

  if (!track) {
    return [];
  }

  return track.blockedCapabilityIds
    .map((capabilityId) => getOniaCapability(capabilityId))
    .filter((capability): capability is OniaCapabilityDefinition => Boolean(capability));
}
