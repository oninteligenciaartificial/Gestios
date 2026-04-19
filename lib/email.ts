const FROM = process.env.EMAIL_FROM ?? "GestiOS <noreply@gestios.app>";

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

function baseTemplate(content: string, orgName: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${orgName}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif;color:#e0e0e0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
        <tr><td style="background:linear-gradient(135deg,#ff6b00,#ff8c00);padding:28px 32px;">
          <span style="font-size:22px;font-weight:800;letter-spacing:2px;color:#000;">${orgName}</span>
        </td></tr>
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <span style="font-size:12px;color:#555;">Gestionado con <strong style="color:#ff6b00;">GestiOS</strong></span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendOrderConfirmation(args: SendOrderConfirmationArgs) {
  if (!process.env.RESEND_API_KEY) return;
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const itemsHtml = args.items.map(i =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ccc;">${i.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:#ccc;">${i.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;color:#fff;font-weight:600;">$${Number(i.unitPrice).toLocaleString("es-MX")}</td>
    </tr>`
  ).join("");

  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Pedido confirmado</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Hola <strong style="color:#fff;">${args.customerName}</strong>, recibimos tu pedido.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <th style="text-align:left;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">PRODUCTO</th>
        <th style="text-align:center;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">CANT.</th>
        <th style="text-align:right;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">PRECIO</th>
      </tr>
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding-top:16px;font-weight:700;color:#fff;">Total</td>
        <td style="padding-top:16px;text-align:right;font-size:18px;font-weight:800;color:#ff6b00;">$${Number(args.total).toLocaleString("es-MX")}</td>
      </tr>
    </table>
    <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px 18px;margin-bottom:8px;">
      <span style="font-size:13px;color:#888;">Pago: </span>
      <span style="font-size:13px;color:#fff;font-weight:600;">${PAYMENT_LABELS[args.paymentMethod] ?? args.paymentMethod}</span>
    </div>
    <p style="margin:20px 0 0;font-size:13px;color:#666;">Folio de pedido: <code style="color:#ff6b00;">#${args.orderId.slice(-8).toUpperCase()}</code></p>
  `;

  await resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `Pedido recibido — ${args.orgName}`,
    html: baseTemplate(content, args.orgName),
  });
}

export async function sendOrderStatusUpdate(args: SendOrderStatusArgs) {
  if (!process.env.RESEND_API_KEY) return;
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const statusLabel = STATUS_LABELS[args.status] ?? args.status;
  const statusColor = args.status === "ENTREGADO" ? "#22c55e" : args.status === "CANCELADO" ? "#ef4444" : "#ff6b00";

  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Actualizacion de pedido</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Hola <strong style="color:#fff;">${args.customerName}</strong>, tu pedido fue actualizado.</p>
    <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:13px;color:#666;margin-bottom:8px;">Estado actual</div>
      <div style="font-size:24px;font-weight:800;color:${statusColor};">${statusLabel}</div>
    </div>
    <p style="margin:0;font-size:13px;color:#666;">Folio: <code style="color:#ff6b00;">#${args.orderId.slice(-8).toUpperCase()}</code></p>
  `;

  await resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `Tu pedido esta ${statusLabel} — ${args.orgName}`,
    html: baseTemplate(content, args.orgName),
  });
}

export async function sendLowStockAlert(args: SendLowStockAlertArgs) {
  if (!process.env.RESEND_API_KEY) return;
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const rowsHtml = args.products.map(p =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ccc;">${p.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:#ef4444;font-weight:700;">${p.stock}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:#666;">${p.minStock}</td>
    </tr>`
  ).join("");

  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Alerta de stock bajo</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Los siguientes productos necesitan reabastecimiento en <strong style="color:#fff;">${args.orgName}</strong>:</p>
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

  await resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `⚠️ ${args.products.length} producto(s) con stock bajo — ${args.orgName}`,
    html: baseTemplate(content, args.orgName),
  });
}

export async function sendWelcomeEmail(args: SendWelcomeEmailArgs) {
  if (!process.env.RESEND_API_KEY) return;
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Bienvenido/a a ${args.orgName}</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Hola <strong style="color:#fff;">${args.customerName}</strong>, tu registro fue exitoso.</p>
    <div style="background:rgba(255,107,0,0.08);border:1px solid rgba(255,107,0,0.2);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">🎉</div>
      <div style="font-size:15px;color:#ccc;">Ya eres parte de nuestra comunidad. A partir de ahora podras acumular puntos y recibir ofertas exclusivas.</div>
    </div>
    <p style="margin:0;font-size:13px;color:#666;">Si tienes alguna pregunta, contacta directamente a ${args.orgName}.</p>
  `;

  await resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `Bienvenido/a a ${args.orgName}`,
    html: baseTemplate(content, args.orgName),
  });
}

export async function sendBirthdayEmail(args: SendBirthdayEmailArgs) {
  if (!process.env.RESEND_API_KEY) return;
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Feliz cumpleanos, ${args.customerName}!</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">En tu dia especial, <strong style="color:#fff;">${args.orgName}</strong> tiene un regalo para ti.</p>
    <div style="background:rgba(255,107,0,0.08);border:1px solid rgba(255,107,0,0.2);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:13px;color:#888;margin-bottom:8px;">Tu codigo de descuento</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:3px;color:#ff6b00;">${args.discountCode}</div>
      <div style="font-size:13px;color:#ccc;margin-top:8px;">${args.discountValue}% de descuento en tu proximo pedido</div>
    </div>
    <p style="margin:0;font-size:13px;color:#666;">Valido solo hoy. Presentalo al realizar tu pedido.</p>
  `;

  await resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `Feliz cumpleanos ${args.customerName}! Tienes un regalo de ${args.orgName}`,
    html: baseTemplate(content, args.orgName),
  });
}

export async function sendLoyaltyPointsEmail(args: SendLoyaltyPointsEmailArgs) {
  if (!process.env.RESEND_API_KEY) return;
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Puntos acumulados</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Hola <strong style="color:#fff;">${args.customerName}</strong>, tu pedido fue entregado.</p>
    <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:13px;color:#666;margin-bottom:4px;">Puntos ganados en este pedido</div>
      <div style="font-size:36px;font-weight:900;color:#ff6b00;">+${args.pointsEarned}</div>
      <div style="border-top:1px solid rgba(255,255,255,0.06);margin-top:16px;padding-top:16px;">
        <div style="font-size:13px;color:#666;">Total acumulado</div>
        <div style="font-size:22px;font-weight:700;color:#fff;">${args.totalPoints} puntos</div>
      </div>
    </div>
    <p style="margin:0;font-size:13px;color:#666;">Sigue comprando en <strong style="color:#ff6b00;">${args.orgName}</strong> para acumular mas puntos.</p>
  `;

  await resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `+${args.pointsEarned} puntos acumulados en ${args.orgName}`,
    html: baseTemplate(content, args.orgName),
  });
}

export async function sendNewOrderAlert(args: SendNewOrderAlertArgs) {
  if (!process.env.RESEND_API_KEY) return;
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const itemsHtml = args.items.map(i =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ccc;">${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:#ccc;">${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;color:#fff;font-weight:600;">$${Number(i.unitPrice).toLocaleString("es-MX")}</td>
    </tr>`
  ).join("");

  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Nuevo pedido recibido</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">El cliente <strong style="color:#fff;">${args.customerName}</strong> realizo un pedido.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <th style="text-align:left;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">PRODUCTO</th>
        <th style="text-align:center;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">CANT.</th>
        <th style="text-align:right;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">PRECIO</th>
      </tr>
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding-top:14px;font-weight:700;color:#fff;">Total</td>
        <td style="padding-top:14px;text-align:right;font-size:18px;font-weight:800;color:#ff6b00;">$${Number(args.total).toLocaleString("es-MX")}</td>
      </tr>
    </table>
    <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px 18px;margin-bottom:8px;">
      <span style="font-size:13px;color:#888;">Pago: </span>
      <span style="font-size:13px;color:#fff;font-weight:600;">${PAYMENT_LABELS[args.paymentMethod] ?? args.paymentMethod}</span>
    </div>
    <p style="margin:16px 0 0;font-size:13px;color:#666;">Folio: <code style="color:#ff6b00;">#${args.orderId.slice(-8).toUpperCase()}</code></p>
  `;

  await resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `Nuevo pedido de ${args.customerName} — ${args.orgName}`,
    html: baseTemplate(content, args.orgName),
  });
}

export async function sendExpiryAlert(args: SendExpiryAlertArgs) {
  if (!process.env.RESEND_API_KEY) return;
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const rowsHtml = args.products.map(p =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ccc;">${p.name}${p.sku ? ` <span style="color:#555;font-size:11px;">(${p.sku})</span>` : ""}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:#ccc;">${p.batchExpiry.toLocaleDateString("es-MX")}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:${p.daysLeft <= 3 ? "#ef4444" : "#f59e0b"};font-weight:700;">${p.daysLeft} dias</td>
    </tr>`
  ).join("");

  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Productos proximos a vencer</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Los siguientes productos vencen en los proximos 7 dias en <strong style="color:#fff;">${args.orgName}</strong>:</p>
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

  await resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `⚠️ ${args.products.length} producto(s) proximos a vencer — ${args.orgName}`,
    html: baseTemplate(content, args.orgName),
  });
}
