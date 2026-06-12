export const OAUTH_NEXT_COOKIE = "gestios_oauth_next";

export function sanitizeOauthNext(value: string | null | undefined): string {
  if (!value) return "/dashboard";

  let decoded = value;

  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return "/dashboard";
  }

  return decoded;
}
