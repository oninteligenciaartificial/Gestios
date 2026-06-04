type MonitoringContext = Record<string, unknown>;

let sentryUnavailableLogged = false;

const SENSITIVE_KEY_PATTERN =
  /(authorization|bearer|cookie|password|secret|token|api[_-]?key|service[_-]?role|database[_-]?url)/i;

function sanitizeMonitoringValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[MaxDepth]";
  if (Array.isArray(value)) return value.map((item) => sanitizeMonitoringValue(item, depth + 1));
  if (!value || typeof value !== "object") return value;

  const sanitized: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    sanitized[key] = SENSITIVE_KEY_PATTERN.test(key)
      ? "[REDACTED]"
      : sanitizeMonitoringValue(nestedValue, depth + 1);
  }
  return sanitized;
}

export function sanitizeMonitoringContext(context?: MonitoringContext): MonitoringContext | undefined {
  if (!context) return undefined;
  return sanitizeMonitoringValue(context) as MonitoringContext;
}

async function captureWithSentry(
  error: unknown,
  scope: string,
  context?: MonitoringContext
): Promise<void> {
  const sanitizedContext = sanitizeMonitoringContext(context);

  try {
    const sentry = await import("@sentry/nextjs");
    sentry.captureException(error, {
      tags: { scope },
      extra: sanitizedContext,
    });
  } catch {
    if (!sentryUnavailableLogged) {
      sentryUnavailableLogged = true;
      console.warn("[monitoring] @sentry/nextjs no esta instalado. Se usa fallback por consola.");
    }
  }
}

export function reportAsyncError(
  scope: string,
  error: unknown,
  context?: MonitoringContext
): void {
  console.error(`[${scope}] operacion async fallo`, {
    error,
    ...sanitizeMonitoringContext(context),
  });
  void captureWithSentry(error, scope, context);
}

/**
 * Set user context in Sentry for better error tracking.
 * Call this after authentication to associate errors with users.
 */
export async function setSentryUser(user: {
  id: string;
  email?: string;
  organizationId?: string;
  role?: string;
}): Promise<void> {
  try {
    const sentry = await import("@sentry/nextjs");
    sentry.setUser({
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    });
  } catch {
    // Sentry not available, ignore.
  }
}

/**
 * Clear user context in Sentry (e.g., on logout).
 */
export async function clearSentryUser(): Promise<void> {
  try {
    const sentry = await import("@sentry/nextjs");
    sentry.setUser(null);
  } catch {
    // Sentry not available, ignore.
  }
}

/**
 * Add breadcrumb for better error context tracing.
 */
export async function addSentryBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    const sentry = await import("@sentry/nextjs");
    sentry.addBreadcrumb({
      category,
      message,
      data: sanitizeMonitoringContext(data),
      level: "info",
    });
  } catch {
    // Sentry not available, ignore.
  }
}

/**
 * Capture a custom message (not an error) in Sentry.
 * Useful for tracking important events.
 */
export async function captureSentryMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: MonitoringContext
): Promise<void> {
  try {
    const sentry = await import("@sentry/nextjs");
    sentry.captureMessage(message, {
      level,
      extra: sanitizeMonitoringContext(context),
    });
  } catch {
    // Sentry not available, ignore.
  }
}
