import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  price: z.number().min(0).default(0),
  cost: z.number().min(0).default(0),
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(5),
  batchExpiry: z.string().optional(),
  imageUrl: z.string().optional(),
});

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const categoryId = searchParams.get("categoryId");

  const products = await prisma.product.findMany({
    where: {
      organizationId: profile.organizationId,
      active: true,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    include: { category: { select: { id: true, name: true } }, supplier: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos", details: result.error.issues }, { status: 400 });

  const { name, description, sku, barcode, unit, categoryId, supplierId, price, cost, stock, minStock, batchExpiry, imageUrl } = result.data;

  const product = await prisma.product.create({
    data: {
      organizationId: profile.organizationId,
      name: name.trim(),
      description: description ?? null,
      sku: sku ?? null,
      barcode: barcode ?? null,
      unit: unit ?? null,
      categoryId: categoryId ?? null,
      supplierId: supplierId ?? null,
      price,
      cost,
      stock,
      minStock,
      batchExpiry: batchExpiry ? new Date(batchExpiry) : null,
      imageUrl: imageUrl ?? null,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
