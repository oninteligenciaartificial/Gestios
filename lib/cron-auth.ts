/**
 * Timing-safe verification of the CRON_SECRET bearer token.
 * Uses XOR comparison to prevent timing-based token oracle attacks.
 */
export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("Authorization");
  const provided = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!secret || !provided) return false;
  if (secret.length !== provided.length) return false;

  let diff = 0;
  for (let i = 0; i < secret.length; i++) {
    diff |= secret.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}
