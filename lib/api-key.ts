function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function getApiKeyFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return bearer ?? request.headers.get("x-gestios-api-key");
}

export function verifyApiKey(request: Request, envName: string): boolean {
  const expected = process.env[envName];
  const provided = getApiKeyFromRequest(request);

  if (!expected || !provided) return false;
  return constantTimeEqual(provided, expected);
}
