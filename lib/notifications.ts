import { prisma } from "@/lib/prisma";

interface CreateNotifArgs {
  organizationId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  userId?: string;
}

/** Fire-and-forget notification creator. Never throws. */
export async function createNotification(args: CreateNotifArgs): Promise<void> {
  await prisma.notification.create({ data: args }).catch(() => {});
}

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  hasVariants?: boolean | null;
}

export async function createLowStockNotificationForProduct(args: {
  organizationId: string;
  product: LowStockProduct;
}): Promise<void> {
  const { organizationId, product } = args;
  if (product.hasVariants || product.stock > product.minStock) return;

  const link = `/inventory/${product.id}`;

  try {
    const existing = await prisma.notification.findFirst({
      where: {
        organizationId,
        type: "stock_bajo",
        read: false,
        link,
      },
      select: { id: true },
    });
    if (existing) return;

    await prisma.notification.create({
      data: {
        organizationId,
        type: "stock_bajo",
        title: "Stock bajo",
        body: `${product.name} esta en ${product.stock} unidad(es). Minimo recomendado: ${product.minStock}.`,
        link,
      },
    });
  } catch {
    /* fire-and-forget helper: inventory flows must not fail because of notifications */
  }
}

export async function createLowStockNotificationsForProducts(args: {
  organizationId: string;
  products: LowStockProduct[];
}): Promise<void> {
  await Promise.all(
    args.products.map((product) =>
      createLowStockNotificationForProduct({ organizationId: args.organizationId, product })
    )
  );
}
