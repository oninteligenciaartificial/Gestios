import { config } from "dotenv";

config({ path: ".env", quiet: true });
config({ path: ".env.local", override: true, quiet: true });

const requiredForPilot = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "DATABASE_URL",
  "CRON_SECRET",
];

const requiredForPublicRelease = [
  ...requiredForPilot,
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "SENTRY_AUTH_TOKEN",
];

const distributedRateLimitOptions = [
  ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
];

const strict = process.argv.includes("--strict");
const required = strict ? requiredForPublicRelease : requiredForPilot;
const missing = required.filter((name) => !process.env[name]);
const invalid = [];

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co")) {
      invalid.push("NEXT_PUBLIC_SUPABASE_URL");
    }
  } catch {
    invalid.push("NEXT_PUBLIC_SUPABASE_URL");
  }
}

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("postgres")) {
  invalid.push("DATABASE_URL");
}

if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
  invalid.push("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
}

const hasDistributedRateLimit = distributedRateLimitOptions.some(([url, token]) => {
  return Boolean(process.env[url] && process.env[token]);
});

const warnings = [];
if (!hasDistributedRateLimit) {
  warnings.push("Rate limiting distribuido no configurado: falta Upstash Redis o Vercel KV.");
}

function printList(title, items) {
  if (items.length === 0) return;
  console.log(title);
  for (const item of items) console.log(`- ${item}`);
}

console.log(`Release env check (${strict ? "public-release" : "pilot"})`);
console.log(`Required variables present: ${required.length - missing.length}/${required.length}`);
printList("Missing variables:", missing);
printList("Invalid variables:", invalid);
printList("Warnings:", warnings);

if (missing.length > 0 || invalid.length > 0 || (strict && warnings.length > 0)) {
  process.exitCode = 1;
}
