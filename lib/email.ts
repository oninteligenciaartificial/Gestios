import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

const FROM_NAME = process.env.EMAIL_FROM_NAME ?? process.env.BREVO_SENDER_NAME ?? "GestiOS";
const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS ?? process.env.BREVO_SENDER_EMAIL ?? "noreply@onia.com.bo";
const DEFAULT_PUBLIC_BASE_URL = "https://www.gestioshq.app";

// Resend free: 3000/month (~100/day). Keep daily guard.
const DAILY_EMAIL_LIMIT = 90; // Leave buffer under 100/day free tier

let _resend: Resend | null = null;
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

async function checkDailyEmailLimit(): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  const key = `email:daily:${today}`;
  const result = await consumeRateLimit(key, { windowMs: 24 * 60 * 60 * 1000, max: DAILY_EMAIL_LIMIT });
  if (!result.allowed) {
    console.warn(`[email] Daily email limit reached (${DAILY_EMAIL_LIMIT}). Emails queued for tomorrow.`);
    return false;
  }
  return true;
}

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface SendWelcomeEmailArgs {
  to: string;
  customerName: string;
  orgName: string;
}

interface SendBirthdayEmailArgs {
  to: string;
  customerName: string;
  orgName: string;
  discountCode: string;
  discountValue: number;
}

interface SendLoyaltyPointsEmailArgs {
  to: string;
  customerName: string;
  orgName: string;
  pointsEarned: number;
  totalPoints: number;
}

interface SendNewOrderAlertArgs {
  to: string;
  orgName: string;
  orderId: string;
  customerName: string;
  total: number;
  items: OrderItem[];
  paymentMethod: string;
}

interface SendExpiryAlertArgs {
  to: string;
  orgName: string;
  products: { name: string; sku: string | null; batchExpiry: Date; daysLeft: number }[];
}

interface SendOrderConfirmationArgs {
  to: string;
  customerName: string;
  orgName: string;
  orderId: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
}

interface SendOrderStatusArgs {
  to: string;
  customerName: string;
  orgName: string;
  orderId: string;
  status: string;
}

interface SendLowStockAlertArgs {
  to: string;
  orgName: string;
  products: { name: string; stock: number; minStock: number }[];
}

interface SendPlainArgs {
  to: string;
  subject: string;
  text: string;
}

interface SendInactiveCustomerArgs {
  to: string;
  customerName: string;
  orgName: string;
  daysSinceLastOrder: number;
}

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
};

function formatBob(amount: number) {
  return `Bs. ${Number(amount).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function publicAppUrl(path = "") {
  const base = getPublicBaseUrl();
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

// =============================================
// Core email functions with logging
// =============================================

async function logEmailSend(
  organizationId: string | null,
  to: string,
  type: string,
  subject: string,
  status: "SENT" | "FAILED",
  brevoMessageId?: string,
  error?: string
) {
  try {
    await prisma.emailLog.create({
      data: {
        organizationId,
        to,
        type,
        subject,
        status,
        brevoMessageId,
        error,
      },
    });
  } catch (logError) {
    // Don't let logging failures break email sending
    console.error("[email] Failed to log email:", logError);
  }
}

async function sendEmail(to: string, subject: string, htmlContent: string, toName?: string, type?: string, organizationId?: string | null) {
  const resend = getResend();
  if (!resend) {
    await logEmailSend(organizationId ?? null, to, type ?? "unknown", subject, "FAILED", undefined, "RESEND_API_KEY not configured");
    return;
  }

  const withinLimit = await checkDailyEmailLimit();
  if (!withinLimit) {
    await logEmailSend(organizationId ?? null, to, type ?? "unknown", subject, "FAILED", undefined, "Daily email limit reached");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html: htmlContent,
      text: htmlToText(htmlContent),
    });

    if (error) {
      await logEmailSend(organizationId ?? null, to, type ?? "unknown", subject, "FAILED", undefined, error.message);
    } else {
      await logEmailSend(organizationId ?? null, to, type ?? "unknown", subject, "SENT", data?.id);
    }
  } catch (error) {
    await logEmailSend(organizationId ?? null, to, type ?? "unknown", subject, "FAILED", undefined, error instanceof Error ? error.message : String(error));
  }
}

async function sendPlainEmail(to: string, subject: string, textContent: string, type?: string, organizationId?: string | null) {
  const resend = getResend();
  if (!resend) {
    await logEmailSend(organizationId ?? null, to, type ?? "unknown", subject, "FAILED", undefined, "RESEND_API_KEY not configured");
    return;
  }

  const withinLimit = await checkDailyEmailLimit();
  if (!withinLimit) {
    await logEmailSend(organizationId ?? null, to, type ?? "unknown", subject, "FAILED", undefined, "Daily email limit reached");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      text: textContent,
    });

    if (error) {
      await logEmailSend(organizationId ?? null, to, type ?? "unknown", subject, "FAILED", undefined, error.message);
    } else {
      await logEmailSend(organizationId ?? null, to, type ?? "unknown", subject, "SENT", data?.id);
    }
  } catch (error) {
    await logEmailSend(organizationId ?? null, to, type ?? "unknown", subject, "FAILED", undefined, error instanceof Error ? error.message : String(error));
  }
}

// =============================================
// Template
// =============================================

function getPublicBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_PUBLIC_BASE_URL).replace(/\/$/, "");
}

function baseTemplate(content: string, orgName: string, preheader = "Notificacion operativa de GestiOS") {
  const safeOrgName = escapeHtml(orgName);
  const safePreheader = escapeHtml(preheader);
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeOrgName}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e0e0e0;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
        <tr><td style="background:#0f1115;padding:24px 32px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:28px;line-height:1;font-weight:900;letter-spacing:0;color:#ffffff;">
            Gesti<span style="color:#ff6b00;">OS</span>
          </div>
          <div style="margin-top:10px;font-size:13px;font-weight:700;color:#ffffff;">${safeOrgName}</div>
          <div style="margin-top:4px;font-size:12px;color:#8a8f98;">Gestion operativa, inventario y control administrativo</div>
        </td></tr>
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <div style="font-size:12px;color:#8a8f98;line-height:1.6;">
            Gestionado con <strong style="color:#ff6b00;">GestiOS</strong><br>
            Si no esperabas este correo, responde a soporte o contacta al administrador de tu cuenta.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// =============================================
// Email types
// =============================================

export async function sendOrderConfirmation(args: SendOrderConfirmationArgs) {
  const safeCustomerName = escapeHtml(args.customerName);
  const trackingUrl = publicAppUrl(`/pedido/${encodeURIComponent(args.orderId)}`);
  const safePaymentLabel = escapeHtml(PAYMENT_LABELS[args.paymentMethod] ?? args.paymentMethod);
  const safeOrderCode = escapeHtml(args.orderId.slice(-8).toUpperCase());
  const itemsHtml = args.items.map(i =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ccc;">${escapeHtml(i.name)}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:#ccc;">${i.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;color:#fff;font-weight:600;">${formatBob(i.unitPrice)}</td>
    </tr>`
  ).join("");

  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Pedido confirmado</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Hola <strong style="color:#fff;">${safeCustomerName}</strong>, recibimos tu pedido.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <th style="text-align:left;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">PRODUCTO</th>
        <th style="text-align:center;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">CANT.</th>
        <th style="text-align:right;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">PRECIO</th>
      </tr>
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding-top:16px;font-weight:700;color:#fff;">Total</td>
        <td style="padding-top:16px;text-align:right;font-size:18px;font-weight:800;color:#ff6b00;">${formatBob(args.total)}</td>
      </tr>
    </table>
    <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px 18px;margin-bottom:8px;">
      <span style="font-size:13px;color:#888;">Pago: </span>
      <span style="font-size:13px;color:#fff;font-weight:600;">${safePaymentLabel}</span>
    </div>
    <p style="margin:20px 0 0;font-size:13px;color:#666;">Folio de pedido: <code style="color:#ff6b00;">#${safeOrderCode}</code></p>
    <div style="text-align:center;margin-top:24px;">
      <a href="${trackingUrl}" style="display:inline-block;padding:12px 28px;background:#ff6b00;color:#000;font-weight:700;border-radius:50px;text-decoration:none;font-size:14px;">Ver estado del pedido</a>
    </div>
  `;

  await sendEmail(args.to, `Pedido recibido — ${args.orgName}`, baseTemplate(content, args.orgName), args.customerName, "order_confirmation");
}

export async function sendOrderStatusUpdate(args: SendOrderStatusArgs) {
  const statusLabel = STATUS_LABELS[args.status] ?? args.status;
  const safeStatusLabel = escapeHtml(statusLabel);
  const safeCustomerName = escapeHtml(args.customerName);
  const trackingUrl = publicAppUrl(`/pedido/${encodeURIComponent(args.orderId)}`);
  const safeOrderCode = escapeHtml(args.orderId.slice(-8).toUpperCase());
  const statusColor = args.status === "ENTREGADO" ? "#22c55e" : args.status === "CANCELADO" ? "#ef4444" : "#ff6b00";

  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Actualizacion de pedido</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Hola <strong style="color:#fff;">${safeCustomerName}</strong>, tu pedido fue actualizado.</p>
    <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:13px;color:#666;margin-bottom:8px;">Estado actual</div>
      <div style="font-size:24px;font-weight:800;color:${statusColor};">${safeStatusLabel}</div>
    </div>
    <p style="margin:0 0 20px;font-size:13px;color:#666;">Folio: <code style="color:#ff6b00;">#${safeOrderCode}</code></p>
    <div style="text-align:center;">
      <a href="${trackingUrl}" style="display:inline-block;padding:12px 28px;background:#ff6b00;color:#000;font-weight:700;border-radius:50px;text-decoration:none;font-size:14px;">Ver estado del pedido</a>
    </div>
  `;

  await sendEmail(args.to, `Tu pedido esta ${statusLabel} — ${args.orgName}`, baseTemplate(content, args.orgName), args.customerName, "order_status_update");
}

export async function sendLowStockAlert(args: SendLowStockAlertArgs) {
  const safeOrgName = escapeHtml(args.orgName);
  const rowsHtml = args.products.map(p =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ccc;">${escapeHtml(p.name)}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:#ef4444;font-weight:700;">${p.stock}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:#666;">${p.minStock}</td>
    </tr>`
  ).join("");

  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Alerta de stock bajo</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Los siguientes productos necesitan reabastecimiento en <strong style="color:#fff;">${safeOrgName}</strong>:</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <th style="text-align:left;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">PRODUCTO</th>
        <th style="text-align:center;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">STOCK ACTUAL</th>
        <th style="text-align:center;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">MINIMO</th>
      </tr>
      ${rowsHtml}
    </table>
    <p style="margin:24px 0 0;font-size:13px;color:#666;">Entra a GestiOS para reabastecer tu inventario.</p>
  `;

  await sendEmail(args.to, `${args.products.length} producto(s) con stock bajo — ${args.orgName}`, baseTemplate(content, args.orgName), undefined, "low_stock_alert");
}

export async function sendWelcomeEmail(args: SendWelcomeEmailArgs) {
  const safeCustomerName = escapeHtml(args.customerName);
  const safeOrgName = escapeHtml(args.orgName);
  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Bienvenido/a a ${safeOrgName}</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Hola <strong style="color:#fff;">${safeCustomerName}</strong>, tu registro fue exitoso.</p>
    <div style="background:rgba(255,107,0,0.08);border:1px solid rgba(255,107,0,0.2);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">&#127881;</div>
      <div style="font-size:15px;color:#ccc;">Ya eres parte de nuestra comunidad. A partir de ahora podras acumular puntos y recibir ofertas exclusivas.</div>
    </div>
    <p style="margin:0;font-size:13px;color:#666;">Si tienes alguna pregunta, contacta directamente a ${safeOrgName}.</p>
  `;

  await sendEmail(args.to, `Bienvenido/a a ${args.orgName}`, baseTemplate(content, args.orgName), args.customerName, "welcome_email");
}

export async function sendBirthdayEmail(args: SendBirthdayEmailArgs) {
  const safeCustomerName = escapeHtml(args.customerName);
  const safeOrgName = escapeHtml(args.orgName);
  const safeDiscountCode = escapeHtml(args.discountCode);
  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Feliz cumpleanos, ${safeCustomerName}!</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">En tu dia especial, <strong style="color:#fff;">${safeOrgName}</strong> tiene un regalo para ti.</p>
    <div style="background:rgba(255,107,0,0.08);border:1px solid rgba(255,107,0,0.2);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:13px;color:#888;margin-bottom:8px;">Tu codigo de descuento</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:3px;color:#ff6b00;">${safeDiscountCode}</div>
      <div style="font-size:13px;color:#ccc;margin-top:8px;">${args.discountValue}% de descuento en tu proximo pedido</div>
    </div>
    <p style="margin:0;font-size:13px;color:#666;">Valido solo hoy. Presentalo al realizar tu pedido.</p>
  `;

  await sendEmail(args.to, `Feliz cumpleanos ${args.customerName}! Regalo de ${args.orgName}`, baseTemplate(content, args.orgName), args.customerName, "birthday_email");
}

export async function sendLoyaltyPointsEmail(args: SendLoyaltyPointsEmailArgs) {
  const safeCustomerName = escapeHtml(args.customerName);
  const safeOrgName = escapeHtml(args.orgName);
  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Puntos acumulados</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Hola <strong style="color:#fff;">${safeCustomerName}</strong>, tu pedido fue entregado.</p>
    <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:13px;color:#666;margin-bottom:4px;">Puntos ganados en este pedido</div>
      <div style="font-size:36px;font-weight:900;color:#ff6b00;">+${args.pointsEarned}</div>
      <div style="border-top:1px solid rgba(255,255,255,0.06);margin-top:16px;padding-top:16px;">
        <div style="font-size:13px;color:#666;">Total acumulado</div>
        <div style="font-size:22px;font-weight:700;color:#fff;">${args.totalPoints} puntos</div>
      </div>
    </div>
    <p style="margin:0;font-size:13px;color:#666;">Sigue comprando en <strong style="color:#ff6b00;">${safeOrgName}</strong> para acumular mas puntos.</p>
  `;

  await sendEmail(args.to, `+${args.pointsEarned} puntos acumulados en ${args.orgName}`, baseTemplate(content, args.orgName), args.customerName, "loyalty_points_email");
}

export async function sendNewOrderAlert(args: SendNewOrderAlertArgs) {
  const safeCustomerName = escapeHtml(args.customerName);
  const safePaymentLabel = escapeHtml(PAYMENT_LABELS[args.paymentMethod] ?? args.paymentMethod);
  const safeOrderCode = escapeHtml(args.orderId.slice(-8).toUpperCase());
  const itemsHtml = args.items.map(i =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ccc;">${escapeHtml(i.name)}</td>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:#ccc;">${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;color:#fff;font-weight:600;">${formatBob(i.unitPrice)}</td>
    </tr>`
  ).join("");

  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Nuevo pedido recibido</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">El cliente <strong style="color:#fff;">${safeCustomerName}</strong> realizo un pedido.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <th style="text-align:left;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">PRODUCTO</th>
        <th style="text-align:center;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">CANT.</th>
        <th style="text-align:right;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">PRECIO</th>
      </tr>
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding-top:14px;font-weight:700;color:#fff;">Total</td>
        <td style="padding-top:14px;text-align:right;font-size:18px;font-weight:800;color:#ff6b00;">${formatBob(args.total)}</td>
      </tr>
    </table>
    <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px 18px;margin-bottom:8px;">
      <span style="font-size:13px;color:#888;">Pago: </span>
      <span style="font-size:13px;color:#fff;font-weight:600;">${safePaymentLabel}</span>
    </div>
    <p style="margin:16px 0 0;font-size:13px;color:#666;">Folio: <code style="color:#ff6b00;">#${safeOrderCode}</code></p>
  `;

  await sendEmail(args.to, `Nuevo pedido de ${args.customerName} — ${args.orgName}`, baseTemplate(content, args.orgName), undefined, "new_order_alert");
}

export async function sendExpiryAlert(args: SendExpiryAlertArgs) {
  const safeOrgName = escapeHtml(args.orgName);
  const rowsHtml = args.products.map(p =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ccc;">${escapeHtml(p.name)}${p.sku ? ` <span style="color:#555;font-size:11px;">(${escapeHtml(p.sku)})</span>` : ""}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:#ccc;">${p.batchExpiry.toLocaleDateString("es-MX")}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:${p.daysLeft <= 3 ? "#ef4444" : "#f59e0b"};font-weight:700;">${p.daysLeft} dias</td>
    </tr>`
  ).join("");

  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Productos proximos a vencer</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Los siguientes productos vencen en los proximos 7 dias en <strong style="color:#fff;">${safeOrgName}</strong>:</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <th style="text-align:left;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">PRODUCTO</th>
        <th style="text-align:center;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">VENCE</th>
        <th style="text-align:center;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">DIAS RESTANTES</th>
      </tr>
      ${rowsHtml}
    </table>
    <p style="margin:24px 0 0;font-size:13px;color:#666;">Entra a GestiOS para gestionar tu inventario.</p>
  `;

  await sendEmail(args.to, `${args.products.length} producto(s) proximos a vencer — ${args.orgName}`, baseTemplate(content, args.orgName), undefined, "expiry_alert");
}

export async function sendInactiveCustomerEmail(args: SendInactiveCustomerArgs) {
  const safeCustomerName = escapeHtml(args.customerName);
  const safeOrgName = escapeHtml(args.orgName);
  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Te echamos de menos, ${safeCustomerName}</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Han pasado <strong style="color:#fff;">${args.daysSinceLastOrder} dias</strong> desde tu ultima compra en <strong style="color:#fff;">${safeOrgName}</strong>.</p>
    <div style="background:rgba(255,107,0,0.08);border:1px solid rgba(255,107,0,0.2);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:32px;margin-bottom:12px;">&#128717;</div>
      <div style="font-size:15px;color:#ccc;line-height:1.6;">Tenemos novedades esperandote. Visita ${safeOrgName} y descubre lo nuevo.</div>
    </div>
    <p style="margin:0;font-size:13px;color:#666;">Si necesitas ayuda, contacta directamente a ${safeOrgName}.</p>
  `;

  await sendEmail(args.to, `Te echamos de menos — ${args.orgName}`, baseTemplate(content, args.orgName), args.customerName, "inactive_customer_email");
}

export async function sendPlainNotification(args: SendPlainArgs) {
  await sendPlainEmail(args.to, args.subject, args.text, "plain_notification");
}

export async function sendPlanExpiryWarning(args: { to: string; orgName: string; daysLeft: number; planLabel: string }) {
  const safeOrgName = escapeHtml(args.orgName);
  const safePlanLabel = escapeHtml(args.planLabel);
  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Tu plan vence en ${args.daysLeft} dia${args.daysLeft !== 1 ? "s" : ""}</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">El plan <strong style="color:#fff;">${safePlanLabel}</strong> de <strong style="color:#fff;">${safeOrgName}</strong> esta proximo a vencer.</p>
    <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:40px;margin-bottom:12px;">&#9200;</div>
      <div style="font-size:22px;font-weight:800;color:#f59e0b;margin-bottom:8px;">${args.daysLeft} dia${args.daysLeft !== 1 ? "s" : ""} restante${args.daysLeft !== 1 ? "s" : ""}</div>
      <div style="font-size:14px;color:#aaa;">Renueva para mantener el acceso a todas tus funcionalidades.</div>
    </div>
    <p style="margin:0;font-size:13px;color:#666;">Para renovar, contacta a soporte de GestiOS.</p>
  `;
  await sendEmail(args.to, `Tu plan vence en ${args.daysLeft} dia${args.daysLeft !== 1 ? "s" : ""} — ${args.orgName}`, baseTemplate(content, args.orgName), undefined, "plan_expiry_warning");
}

export async function sendPlanActivatedEmail(args: { to: string; orgName: string; plan: string; expiresAt: Date }) {
  const planLabels: Record<string, string> = { BASICO: "Básico", CRECER: "Crecer", PRO: "Pro", EMPRESARIAL: "Empresarial" };
  const label = planLabels[args.plan] ?? args.plan;
  const safeLabel = escapeHtml(label);
  const safeOrgName = escapeHtml(args.orgName);
  const expiry = args.expiresAt.toLocaleDateString("es-BO", { day: "numeric", month: "long", year: "numeric" });
  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">¡Pago confirmado!</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Tu plan ha sido activado para <strong style="color:#fff;">${safeOrgName}</strong>.</p>
    <div style="background:rgba(255,107,0,0.08);border:1px solid rgba(255,107,0,0.2);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:40px;margin-bottom:12px;">✅</div>
      <div style="font-size:22px;font-weight:800;color:#ff6b00;margin-bottom:4px;">Plan ${safeLabel}</div>
      <div style="font-size:13px;color:#888;">Activo hasta el ${expiry}</div>
    </div>
    <p style="margin:0;font-size:13px;color:#666;">Ya puedes acceder a todas las funciones de tu plan. Si tienes dudas, responde este correo.</p>
  `;
  await sendEmail(args.to, `Plan ${label} activado — ${args.orgName}`, baseTemplate(content, "GestiOS"), undefined, "plan_activated");
}

export async function sendPlanExpired(args: { to: string; orgName: string; planLabel: string }) {
  const safeOrgName = escapeHtml(args.orgName);
  const safePlanLabel = escapeHtml(args.planLabel);
  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Tu plan ha vencido</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">El plan <strong style="color:#fff;">${safePlanLabel}</strong> de <strong style="color:#fff;">${safeOrgName}</strong> vencio hoy.</p>
    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:40px;margin-bottom:12px;">&#128274;</div>
      <div style="font-size:18px;font-weight:700;color:#ef4444;margin-bottom:8px;">Acceso suspendido</div>
      <div style="font-size:14px;color:#aaa;line-height:1.6;">Tu cuenta ha sido suspendida temporalmente. Renueva tu plan para retomar el acceso sin perder ningun dato.</div>
    </div>
    <p style="margin:0;font-size:13px;color:#666;">Para renovar, contacta a soporte de GestiOS de inmediato.</p>
  `;
  await sendEmail(args.to, `Plan vencido — ${args.orgName} necesita renovacion`, baseTemplate(content, args.orgName), undefined, "plan_expired");
}
