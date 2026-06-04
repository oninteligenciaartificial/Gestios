import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { checkOrgRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { canUseFeature, planGateError } from "@/lib/plans";
import { randomUUID } from "crypto";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function detectImageMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0D &&
    bytes[5] === 0x0A &&
    bytes[6] === 0x1A &&
    bytes[7] === 0x0A
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  if (!canUseFeature(profile.plan, "pagos_qr")) {
    return NextResponse.json(planGateError("pagos_qr"), { status: 403 });
  }

  const rateLimited = await checkOrgRateLimit(profile.organizationId, "qr-bolivia-upload", RATE_LIMITS.upload);
  if (rateLimited) return rateLimited;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "FormData invalido" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Maximo 5MB" }, { status: 400 });

  const realMime = detectImageMime(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
  if (!realMime) {
    return NextResponse.json({ error: "Solo se permiten imagenes PNG, JPG o WebP" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const fileName = `${profile.organizationId}/qr-bolivia-${randomUUID()}.${MIME_TO_EXT[realMime]}`;
  const { data, error } = await supabase.storage
    .from("org-assets")
    .upload(fileName, file, {
      contentType: realMime,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("org-assets")
    .getPublicUrl(data.path);

  const existingAddon = await prisma.orgAddon.findUnique({
    where: { organizationId_addon: { organizationId: profile.organizationId, addon: "QR_BOLIVIA" } },
  });

  if (existingAddon) {
    await prisma.orgAddon.update({
      where: { id: existingAddon.id },
      data: { active: true, phoneNumberId: urlData.publicUrl },
    });
  } else {
    await prisma.orgAddon.create({
      data: {
        organizationId: profile.organizationId,
        addon: "QR_BOLIVIA",
        active: true,
        phoneNumberId: urlData.publicUrl,
      },
    });
  }

  return NextResponse.json({ ok: true, url: urlData.publicUrl }, { status: 201 });
}
