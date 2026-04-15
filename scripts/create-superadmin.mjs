import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const EMAIL = "oninteligenciaartificial@gmail.com";
const PASSWORD = "Pronabol2024!Super";
const NAME = "Super Admin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // Verificar si ya existe
  const existing = await prisma.profile.findFirst({ where: { role: "SUPERADMIN" } });
  if (existing) {
    console.log("Ya existe un SUPERADMIN en la base de datos.");
    return;
  }

  // Crear usuario en Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });

  if (error) {
    // Si ya existe el usuario en Supabase, obtener su ID
    if (error.message.includes("already been registered") || error.code === "email_exists") {
      console.log("Usuario ya existe en Supabase Auth, buscando su ID...");
      const { data: list } = await supabase.auth.admin.listUsers();
      const found = list?.users?.find((u) => u.email === EMAIL);
      if (!found) throw new Error("No se pudo encontrar el usuario en Supabase.");

      await prisma.profile.create({
        data: { userId: found.id, name: NAME, role: "SUPERADMIN" },
      });
      console.log(`\n✓ Perfil SUPERADMIN creado para usuario existente.`);
      console.log(`  Email: ${EMAIL}`);
      console.log(`  Usa tu contrasena actual de Supabase.\n`);
      return;
    }
    throw error;
  }

  await prisma.profile.create({
    data: { userId: data.user.id, name: NAME, role: "SUPERADMIN" },
  });

  console.log(`\n✓ SUPERADMIN creado exitosamente.`);
  console.log(`  Email:      ${EMAIL}`);
  console.log(`  Contrasena: ${PASSWORD}`);
  console.log(`  Cambia la contrasena despues de tu primer login.\n`);
}

main()
  .catch((e) => { console.error("Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
