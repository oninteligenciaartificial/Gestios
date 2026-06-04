import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const EMAIL = process.env.SUPERADMIN_EMAIL;
const PASSWORD = process.env.SUPERADMIN_PASSWORD;
const NAME = process.env.SUPERADMIN_NAME ?? "Super Admin";

const required = [
  ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL],
  ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
  ["DATABASE_URL or DIRECT_URL", process.env.DIRECT_URL ?? process.env.DATABASE_URL],
  ["SUPERADMIN_EMAIL", EMAIL],
  ["SUPERADMIN_PASSWORD", PASSWORD],
];

const missing = required.filter(([, value]) => !value).map(([name]) => name);
if (missing.length > 0) {
  console.error(`Faltan variables requeridas: ${missing.join(", ")}`);
  process.exit(1);
}

if (PASSWORD.length < 16) {
  console.error("SUPERADMIN_PASSWORD debe tener al menos 16 caracteres.");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const existing = await prisma.profile.findFirst({ where: { role: "SUPERADMIN" } });
  if (existing) {
    console.log("Ya existe un SUPERADMIN en la base de datos.");
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes("already been registered") || error.code === "email_exists") {
      console.log("Usuario ya existe en Supabase Auth, buscando su ID...");
      const { data: list } = await supabase.auth.admin.listUsers();
      const found = list?.users?.find((u) => u.email === EMAIL);
      if (!found) throw new Error("No se pudo encontrar el usuario en Supabase.");

      await prisma.profile.create({
        data: { userId: found.id, name: NAME, role: "SUPERADMIN" },
      });
      console.log("Perfil SUPERADMIN creado para usuario existente.");
      console.log(`Email: ${EMAIL}`);
      return;
    }
    throw error;
  }

  await prisma.profile.create({
    data: { userId: data.user.id, name: NAME, role: "SUPERADMIN" },
  });

  console.log("SUPERADMIN creado exitosamente.");
  console.log(`Email: ${EMAIL}`);
  console.log("La contrasena no se imprime. Guardala en un gestor seguro y rotala si fue compartida.");
}

main()
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
