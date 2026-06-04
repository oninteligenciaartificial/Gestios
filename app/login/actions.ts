"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit, getRequestIp, RATE_LIMITS } from "@/lib/rate-limit";

type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginAction(_: unknown, formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Email y contrasena son obligatorios." };
  }

  try {
    const requestHeaders = await headers();
    const ip = getRequestIp(requestHeaders);
    const rateLimit = await consumeRateLimit(`login:${ip}:${email.toLowerCase()}`, RATE_LIMITS.auth);
    if (!rateLimit.allowed) {
      return { ok: false, error: "Demasiados intentos. Intenta nuevamente en unos minutos." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false, error: message };
  }
}
