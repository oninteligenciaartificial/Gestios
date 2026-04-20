"use server";

import { createClient } from "@/lib/supabase/server";

type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginAction(_: unknown, formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Email y contraseña son obligatorios." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false, error: message };
  }
}
