import { createHmac, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: ".env", quiet: true });
config({ path: ".env.local", override: true, quiet: true });

const args = new Set(process.argv.slice(2));
const sampleArgIndex = process.argv.findIndex((arg) => arg === "--sample");
const samplePath =
  sampleArgIndex >= 0 && process.argv[sampleArgIndex + 1]
    ? process.argv[sampleArgIndex + 1]
    : "docs/examples/sentry-webhook-sample.json";

const shouldVerifySignature = args.has("--verify-signature");
const rawBody = readFileSync(resolve(samplePath), "utf8");
const payload = JSON.parse(rawBody);

const sensitiveKeyPattern =
  /authorization|cookie|token|secret|password|api[_-]?key|service[_-]?role|dsn/i;
const sensitiveValuePattern = /\bBearer\s+\S+|eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/i;

function redact(value, key = "") {
  if (sensitiveKeyPattern.test(key)) return "[REDACTED]";
  if (typeof value === "string") {
    return sensitiveValuePattern.test(value) ? "[REDACTED]" : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [childKey, redact(childValue, childKey)]),
    );
  }
  return value;
}

function getIssue(payload) {
  return payload?.data?.issue ?? {};
}

function getEvent(payload) {
  return payload?.data?.event ?? payload?.data?.event_alert?.event ?? {};
}

function firstException(event) {
  const exceptionEntry = event.entries?.find((entry) => entry.type === "exception");
  return exceptionEntry?.data?.values?.[0] ?? {};
}

function firstInAppFrame(exception) {
  const frames = exception?.stacktrace?.frames ?? [];
  return [...frames].reverse().find((frame) => frame.in_app) ?? frames.at(-1) ?? {};
}

function severityFor(issue, event) {
  const level = String(issue.level ?? event.level ?? "").toLowerCase();
  const transaction = String(event.transaction ?? "");
  if (level === "fatal") return "P0";
  if (/checkout|pos|billing|auth|orders|ventas/i.test(transaction)) return "P1";
  if (level === "error") return "P1";
  return "P2";
}

function formatTags(tags) {
  if (!Array.isArray(tags)) return "-";
  return tags
    .map((tag) => {
      if (Array.isArray(tag)) return `${tag[0]}=${tag[1]}`;
      if (tag && typeof tag === "object") return `${tag.key}=${tag.value}`;
      return String(tag);
    })
    .join(", ");
}

function buildGitHubIssue(payload) {
  const redactedPayload = redact(payload);
  const issue = getIssue(redactedPayload);
  const event = getEvent(redactedPayload);
  const exception = firstException(event);
  const frame = firstInAppFrame(exception);
  const type = issue.metadata?.type ?? exception.type ?? "Sentry issue";
  const transaction = event.transaction ?? "unknown transaction";
  const severity = severityFor(issue, event);

  const title = `[Sentry][${severity}] ${type} en ${transaction}`;
  const body = `## Sentry

- Issue: ${issue.permalink ?? "N/A"}
- Issue ID: ${issue.id ?? "N/A"}
- Event ID: ${event.event_id ?? "N/A"}
- Environment: ${event.environment ?? "N/A"}
- Release: ${event.release ?? "N/A"}
- Level: ${issue.level ?? event.level ?? "N/A"}
- Events/users: ${issue.count ?? "N/A"} / ${issue.userCount ?? "N/A"}

## Contexto tecnico

- Route/transaction: ${transaction}
- Platform: ${event.platform ?? "N/A"}
- Exception: ${type}: ${issue.metadata?.value ?? exception.value ?? "N/A"}
- Frame: ${frame.filename ?? "N/A"}:${frame.lineno ?? "N/A"} ${frame.function ?? ""}
- Tags: ${formatTags(event.tags)}

## Redaccion

- [x] No contiene tokens, cookies, Authorization headers ni service role keys.
- [x] Generado por dry-run local antes de activar automatizacion real.

## Instruccion para Codex

Seguir AGENTS.md, docs/ORCHESTRATOR.md, docs/SKILLS_ROUTING.md y docs/MONITORING_REPAIR_FLOW.md. Reproducir, corregir localmente, agregar test de regresion cuando aplique, ejecutar checks y esperar aprobacion humana antes de commit, push, PR o deploy.
`;

  return { title, body };
}

function verifySignature(rawBody) {
  const secret = process.env.SENTRY_WEBHOOK_CLIENT_SECRET;
  const providedSignature = process.env.SENTRY_WEBHOOK_SIGNATURE;
  if (!secret || !providedSignature) {
    throw new Error("Faltan SENTRY_WEBHOOK_CLIENT_SECRET o SENTRY_WEBHOOK_SIGNATURE.");
  }

  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const left = Buffer.from(digest, "hex");
  const right = Buffer.from(providedSignature, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

const issue = buildGitHubIssue(payload);

if (/demo-redacted-token|demo-session=|Bearer\s+\S+|service[_-]?role/i.test(issue.body)) {
  throw new Error("El body generado contiene datos sensibles no redactados.");
}

if (shouldVerifySignature) {
  const valid = verifySignature(rawBody);
  if (!valid) throw new Error("Firma Sentry invalida.");
  console.log("Sentry signature: OK");
} else {
  console.log("Sentry signature: skipped (use --verify-signature with env vars for real validation)");
}

console.log("Monitoring repair dry-run: OK");
console.log(`Title: ${issue.title}`);
console.log("Body preview:");
console.log(issue.body);
