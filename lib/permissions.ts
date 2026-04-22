export type Permission =
  | "products:create"
  | "products:edit"
  | "products:delete"
  | "products:import"
  | "products:export"
  | "orders:create"
  | "orders:edit"
  | "orders:delete"
  | "customers:view"
  | "customers:create"
  | "customers:edit"
  | "reports:view"
  | "caja:view"
  | "suppliers:view"
  | "suppliers:create"
  | "discounts:view"
  | "discounts:create"
  | "staff:manage"
  | "branches:manage"
  | "audit:view"
  | "billing:view"
  | "settings:edit";

type Role = "SUPERADMIN" | "ADMIN" | "MANAGER" | "STAFF" | "VIEWER";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPERADMIN: [] as Permission[], // handled separately
  ADMIN: [
    "products:create", "products:edit", "products:delete", "products:import", "products:export",
    "orders:create", "orders:edit", "orders:delete",
    "customers:view", "customers:create", "customers:edit",
    "reports:view", "caja:view",
    "suppliers:view", "suppliers:create",
    "discounts:view", "discounts:create",
    "staff:manage", "branches:manage",
    "audit:view", "billing:view", "settings:edit",
  ],
  MANAGER: [
    "products:create", "products:edit", "products:export",
    "orders:create", "orders:edit", "orders:delete",
    "customers:view", "customers:create", "customers:edit",
    "reports:view", "caja:view",
    "suppliers:view",
    "discounts:view", "discounts:create",
  ],
  STAFF: [
    "products:create", "products:edit",
    "orders:create", "orders:edit",
    "customers:view", "customers:create",
    "discounts:view",
  ],
  VIEWER: [
    "customers:view",
    "reports:view",
    "caja:view",
  ],
};

export function hasPermission(
  role: string,
  permission: Permission,
  extraPermissions: string[] = []
): boolean {
  if (role === "SUPERADMIN" || role === "ADMIN") return true;
  const base = ROLE_PERMISSIONS[role as Role] ?? [];
  return base.includes(permission) || (extraPermissions as Permission[]).includes(permission);
}

export function getRolePermissions(role: string): Permission[] {
  if (role === "SUPERADMIN" || role === "ADMIN") return Object.keys(ROLE_PERMISSIONS.ADMIN) as Permission[];
  return ROLE_PERMISSIONS[role as Role] ?? [];
}
