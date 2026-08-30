import { Resend } from "resend";
import { paymentVisibility, isPaymentComplete } from "@/lib/preOrderStatus";
import { lineSavings } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM ?? "Seoul Aura <noreply@seoulaura.lk>";
const ADMIN_TO = process.env.ADMIN_EMAIL ?? "kavinduchamith01@gmail.com";
const SITE = "https://seoulaura.lk";

function rupees(amount: number) {
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}

// ─── Shared layout wrapper ────────────────────────────────────────────────────
function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seoul Aura</title>
</head>
<body style="margin:0;padding:0;background:#f9f4f2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1c1917;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f4f2;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#e11d48,#be123c);padding:20px 40px;text-align:center;border-radius:6px 6px 0 0;">
              <a href="${SITE}" style="text-decoration:none;display:inline-block;">
                <img src="${SITE}/logo_white.png" alt="Seoul Aura" width="190" height="190" style="display:block;width:190px;height:190px;margin:0 auto;object-fit:contain;" />
              </a>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-radius:0 0 6px 6px;border:1px solid #f1e8e6;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#78716c;">
                &copy; 2026 Seoul Aura · Sri Lanka's Korean Beauty Destination<br/>
                <a href="${SITE}" style="color:#e11d48;text-decoration:none;">seoulaura.lk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── OTP verification code → Buyer ───────────────────────────────────────────
export async function sendOtpEmail(to: string, code: string, name?: string): Promise<boolean> {
  const html = layout(`
    <h1 style="margin:0 0 4px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1c1917;">
      Verify your account
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#78716c;">
      Hi ${name || "there"}, use the code below to verify your Seoul Aura account.
    </p>
    <div style="text-align:center;margin:0 0 24px;">
      <div style="display:inline-block;background:#fff1f2;border:1px solid #fecdd3;border-radius:8px;padding:18px 32px;">
        <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#be123c;font-family:'Courier New',monospace;">${code}</span>
      </div>
    </div>
    <p style="margin:0;font-size:13px;color:#78716c;text-align:center;">
      This code expires in 5 minutes. If you didn't request it, you can safely ignore this email.<br/>
      Never share this code with anyone.
    </p>
  `);

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Your Seoul Aura verification code is ${code}`,
      html,
    });
    if (error) {
      console.error("[email] OTP send failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] OTP send error:", err);
    return false;
  }
}

function badge(status: string) {
  const colors: Record<string, string> = {
    pending:   "background:#fef3c7;color:#92400e",
    confirmed: "background:#fff1f2;color:#9f1239",
    shipped:   "background:#eff6ff;color:#1e40af",
    delivered: "background:#f0fdf4;color:#166534",
    cancelled: "background:#f5f5f4;color:#57534e",
  };
  const style = colors[status] ?? colors.pending;
  return `<span style="${style};padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;text-transform:capitalize;">${status}</span>`;
}

function itemsTable(items: { name: string; quantity: number; price: number; image?: string }[]) {
  const rows = items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f5f0ee;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;padding-right:12px;">
              ${item.image
                ? `<img src="${item.image}" alt="${item.name}" width="56" height="56"
                    style="width:56px;height:56px;object-fit:cover;border-radius:4px;border:1px solid #f1e8e6;display:block;" />`
                : `<div style="width:56px;height:56px;background:#f9f4f2;border-radius:4px;border:1px solid #f1e8e6;display:block;"></div>`
              }
            </td>
            <td style="vertical-align:middle;">
              <span style="font-size:14px;color:#1c1917;display:block;">${item.name}</span>
              <span style="font-size:12px;color:#78716c;display:block;margin-top:2px;">Qty: ${item.quantity}</span>
            </td>
          </tr>
        </table>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f5f0ee;text-align:right;font-size:14px;font-weight:600;color:#1c1917;white-space:nowrap;vertical-align:middle;">
        ${rupees(item.price * item.quantity)}
      </td>
    </tr>`).join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`;
}

function totalsBlock(
  subtotal: number,
  shippingFee: number,
  discount: number,
  total: number,
  /** Saved against compare-at prices — shown for reassurance, never subtracted. */
  savings = 0
) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
      ${subtotal !== total ? `
      ${savings > 0 ? `<tr>
        <td style="font-size:13px;color:#78716c;padding:3px 0;">Original price</td>
        <td style="font-size:13px;color:#a8a29e;text-decoration:line-through;text-align:right;padding:3px 0;">${rupees(subtotal + savings)}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#b45309;padding:3px 0;">You saved</td>
        <td style="font-size:13px;font-weight:600;color:#b45309;text-align:right;padding:3px 0;">-${rupees(savings)}</td>
      </tr>` : ""}
      <tr>
        <td style="font-size:13px;color:#78716c;padding:3px 0;">Subtotal</td>
        <td style="font-size:13px;color:#78716c;text-align:right;padding:3px 0;">${rupees(subtotal)}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#78716c;padding:3px 0;">Shipping</td>
        <td style="font-size:13px;color:#78716c;text-align:right;padding:3px 0;">${shippingFee === 0 ? "Free" : rupees(shippingFee)}</td>
      </tr>
      ${discount > 0 ? `<tr>
        <td style="font-size:13px;color:#e11d48;padding:3px 0;">Discount</td>
        <td style="font-size:13px;color:#e11d48;text-align:right;padding:3px 0;">-${rupees(discount)}</td>
      </tr>` : ""}
      ` : ""}
      <tr>
        <td style="font-size:16px;font-weight:700;color:#1c1917;padding:10px 0 0;">Total</td>
        <td style="font-size:16px;font-weight:700;color:#1c1917;text-align:right;padding:10px 0 0;">${rupees(total)}</td>
      </tr>
    </table>`;
}

function addressBlock(addr: {
  line1: string; line2?: string; city: string;
  province?: string; postalCode?: string; country: string;
}) {
  const parts = [
    addr.line1,
    addr.line2,
    [addr.city, addr.province].filter(Boolean).join(", "),
    addr.postalCode,
    addr.country,
  ].filter(Boolean);
  return parts.join("<br/>");
}

// ─── 1. Order confirmation → Buyer ───────────────────────────────────────────
interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: { name: string; quantity: number; price: number; image?: string }[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  /** Total saved against compare-at prices. Shown for reassurance, never subtracted. */
  savings?: number;
  total: number;
  orderType: string;
  paymentMethod: string;
  shippingAddress: { line1: string; line2?: string; city: string; province?: string; postalCode?: string; country: string };
  notes?: string;
}

export async function sendOrderConfirmationToBuyer(data: OrderEmailData) {
  const isPreorder = data.orderType === "subscription";
  const html = layout(`
    <h1 style="margin:0 0 4px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1c1917;">
      Order confirmed! 🎉
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#78716c;">
      Hi ${data.customerName}, your order is placed and we're getting it ready.
    </p>

    <div style="background:#fff7f7;border:1px solid #fde8e8;border-radius:4px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#e11d48;font-weight:600;">Order Number</p>
      <p style="margin:4px 0 0;font-size:20px;font-family:monospace;color:#1c1917;font-weight:700;">${data.orderNumber}</p>
    </div>

    <h3 style="margin:0 0 12px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#78716c;">Items</h3>
    ${itemsTable(data.items)}
    ${totalsBlock(data.subtotal, data.shippingFee, data.discount, data.total, data.savings ?? 0)}

    <hr style="border:none;border-top:1px solid #f5f0ee;margin:28px 0;" />

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="50%" valign="top" style="padding-right:16px;">
          <h4 style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#78716c;">Delivery Address</h4>
          <p style="margin:0;font-size:13px;color:#1c1917;line-height:1.7;">${addressBlock(data.shippingAddress)}</p>
        </td>
        <td width="50%" valign="top">
          <h4 style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#78716c;">Payment</h4>
          <p style="margin:0;font-size:13px;color:#1c1917;text-transform:capitalize;">${data.paymentMethod.replace(/_/g, " ")}</p>
        </td>
      </tr>
    </table>

    ${data.notes ? `
    <div style="margin-top:20px;">
      <h4 style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#78716c;">Notes</h4>
      <p style="margin:0;font-size:13px;color:#78716c;font-style:italic;">${data.notes}</p>
    </div>` : ""}

    <hr style="border:none;border-top:1px solid #f5f0ee;margin:28px 0;" />

    <p style="margin:0;font-size:13px;color:#78716c;line-height:1.7;">
      We'll send you another email when your order is shipped. Estimated delivery is <strong>3–5 business days</strong>.
      Questions? Reply to this email or contact us at <a href="mailto:seoulaurateam@gmail.com" style="color:#e11d48;">seoulaurateam@gmail.com</a>.
    </p>

    <div style="margin-top:28px;text-align:center;">
      <a href="${SITE}/account" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:12px 28px;border-radius:3px;letter-spacing:0.5px;">
        View My Orders
      </a>
    </div>
  `);

  return resend.emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `Order Confirmed · ${data.orderNumber} — Seoul Aura`,
    html,
  });
}

// ─── 2. Order notification → Admin ────────────────────────────────────────────
export async function sendOrderNotificationToAdmin(data: OrderEmailData) {
  const html = layout(`
    <h1 style="margin:0 0 4px;font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1c1917;">
      New Order Received
    </h1>
    <p style="margin:0 0 24px;font-size:13px;color:#78716c;">A new order has been placed on Seoul Aura.</p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td style="font-size:12px;color:#78716c;padding:4px 0;width:120px;">Order #</td>
        <td style="font-size:13px;font-weight:700;font-family:monospace;color:#1c1917;">${data.orderNumber}</td>
      </tr>
      <tr>
        <td style="font-size:12px;color:#78716c;padding:4px 0;">Customer</td>
        <td style="font-size:13px;color:#1c1917;">${data.customerName}</td>
      </tr>
      <tr>
        <td style="font-size:12px;color:#78716c;padding:4px 0;">Email</td>
        <td style="font-size:13px;color:#e11d48;">${data.customerEmail}</td>
      </tr>
      <tr>
        <td style="font-size:12px;color:#78716c;padding:4px 0;">Type</td>
        <td style="font-size:13px;color:#1c1917;text-transform:capitalize;">${data.orderType}</td>
      </tr>
      <tr>
        <td style="font-size:12px;color:#78716c;padding:4px 0;">Payment</td>
        <td style="font-size:13px;color:#1c1917;text-transform:capitalize;">${data.paymentMethod.replace(/_/g, " ")}</td>
      </tr>
    </table>

    <h3 style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#78716c;">Items Ordered</h3>
    ${itemsTable(data.items)}
    ${totalsBlock(data.subtotal, data.shippingFee, data.discount, data.total, data.savings ?? 0)}

    <hr style="border:none;border-top:1px solid #f5f0ee;margin:24px 0;" />

    <h4 style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#78716c;">Shipping Address</h4>
    <p style="margin:0;font-size:13px;color:#1c1917;line-height:1.7;">${addressBlock(data.shippingAddress)}</p>

    ${data.notes ? `
    <div style="margin-top:16px;">
      <h4 style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#78716c;">Customer Notes</h4>
      <p style="margin:0;font-size:13px;color:#78716c;font-style:italic;">${data.notes}</p>
    </div>` : ""}

    <div style="margin-top:28px;text-align:center;">
      <a href="${SITE}/admin/orders" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:12px 28px;border-radius:3px;letter-spacing:0.5px;">
        View in Admin Panel
      </a>
    </div>
  `);

  return resend.emails.send({
    from: FROM,
    to: ADMIN_TO,
    subject: `[New Order] ${data.orderNumber} · ${data.customerName} · ${rupees(data.total)}`,
    html,
  });
}

// ─── 3. Order status update → Buyer ──────────────────────────────────────────
const STATUS_MESSAGES: Record<string, { headline: string; detail: string; emoji: string }> = {
  confirmed: {
    emoji: "✅",
    headline: "Your order has been confirmed",
    detail: "We've reviewed your order and it's been confirmed. We'll start preparing it right away.",
  },
  shipped: {
    emoji: "🚚",
    headline: "Your order is on its way!",
    detail: "Your order has been handed to our delivery partner. Estimated delivery: 1–3 business days.",
  },
  delivered: {
    emoji: "🎁",
    headline: "Your order has been delivered",
    detail: "We hope you love your Seoul Aura haul! Leave a review to help others discover great products.",
  },
  cancelled: {
    emoji: "❌",
    headline: "Your order has been cancelled",
    detail: "Your order has been cancelled. If you paid online, a refund will be processed within 5–7 business days. Need help? Contact us.",
  },
};

interface OrderStatusEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
}

export async function sendOrderStatusUpdateToBuyer(data: OrderStatusEmailData) {
  const msg = STATUS_MESSAGES[data.status];
  if (!msg) return; // don't email on "pending" — that's the initial confirmation

  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:12px;">${msg.emoji}</div>
      <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1c1917;">${msg.headline}</h1>
      <p style="margin:0;font-size:14px;color:#78716c;max-width:380px;margin:0 auto;line-height:1.7;">${msg.detail}</p>
    </div>

    <div style="background:#fff7f7;border:1px solid #fde8e8;border-radius:4px;padding:16px 20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#e11d48;font-weight:600;">Order Number</p>
      <p style="margin:4px 0 8px;font-size:18px;font-family:monospace;color:#1c1917;font-weight:700;">${data.orderNumber}</p>
      ${badge(data.status)}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
      <tr>
        <td style="font-size:13px;color:#78716c;">Hi ${data.customerName}</td>
        <td style="font-size:14px;font-weight:700;color:#1c1917;text-align:right;">${rupees(data.total)}</td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #f5f0ee;margin:24px 0;" />

    <div style="text-align:center;">
      <a href="${SITE}/account" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:12px 28px;border-radius:3px;letter-spacing:0.5px;">
        Track My Order
      </a>
    </div>

    <p style="margin-top:24px;font-size:12px;color:#a8a29e;text-align:center;">
      Questions? <a href="mailto:seoulaurateam@gmail.com" style="color:#e11d48;">seoulaurateam@gmail.com</a>
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `${msg.emoji} Order ${data.orderNumber} — ${msg.headline}`,
    html,
  });
}

// ─── 4. Pre-order confirmation → Buyer ───────────────────────────────────────
interface PreOrderItemData {
  productBrand: string;
  productName: string;
  productLink?: string;
  productImage?: string;
  quantity: number;
  unitPrice?: number;
  /** Shop compare-at price, so the invoice can show what the shopper saved. */
  comparePrice?: number;
  /** Set only when this item was repriced in the update being emailed. */
  previousUnitPrice?: number;
  priceChangeReason?: string;
  availability?: "available" | "unavailable";
}

interface PreOrderPriceChangeData {
  productBrand: string;
  productName: string;
  quantity: number;
  previousUnitPrice?: number;
  newUnitPrice: number;
  reason: string;
}

interface PreOrderEmailData {
  requestNumber: string;
  customerName: string;
  customerEmail: string;
  phoneNumber?: string;
  items: PreOrderItemData[];
  origin: string;
  notes?: string;
  deliveryCharge?: number;
  currencySymbol?: string;
  balancePaymentMethod?: "cod" | "bank";
}

function fmt(amount: number, sym: string) {
  return `${sym} ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Unit price cell — shows the compare-at price struck through above what the
 * shopper actually pays, so the discount is visible per product and not only in
 * the totals.
 */
function unitPriceCell(it: PreOrderItemData, sym: string) {
  if (it.unitPrice == null) return '<span style="color:#a8a29e;">To be quoted</span>';
  const discounted = it.comparePrice != null && it.comparePrice > it.unitPrice;
  if (!discounted) return fmt(it.unitPrice, sym);
  return `<span style="color:#a8a29e;text-decoration:line-through;">${fmt(it.comparePrice!, sym)}</span><br/><span style="color:#1c1917;">${fmt(it.unitPrice, sym)}</span>`;
}

/** Line total, with what this one line saved noted underneath. */
function lineTotalCell(it: PreOrderItemData, lineTotal: number | null, sym: string) {
  if (lineTotal == null) return '<span style="color:#a8a29e;">—</span>';
  const saved = lineSavings(it.unitPrice!, it.comparePrice, it.quantity);
  if (saved <= 0) return fmt(lineTotal, sym);
  return `${fmt(lineTotal, sym)}<br/><span style="font-weight:500;font-size:11px;color:#b45309;">Saved ${fmt(saved, sym)}</span>`;
}

function preOrderInvoiceTable(items: PreOrderItemData[], sym: string) {
  const hasPrices = items.some((it) => it.unitPrice != null);

  const headerCells = hasPrices
    ? `<th style="padding:10px 12px;text-align:left;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#78716c;border-bottom:2px solid #f5f0ee;">Product</th>
       <th style="padding:10px 12px;text-align:center;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#78716c;border-bottom:2px solid #f5f0ee;width:48px;">Qty</th>
       <th style="padding:10px 12px;text-align:right;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#78716c;border-bottom:2px solid #f5f0ee;white-space:nowrap;">Unit Price</th>
       <th style="padding:10px 12px;text-align:right;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#78716c;border-bottom:2px solid #f5f0ee;white-space:nowrap;">Amount</th>`
    : `<th style="padding:10px 12px;text-align:left;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#78716c;border-bottom:2px solid #f5f0ee;">Product</th>
       <th style="padding:10px 12px;text-align:center;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#78716c;border-bottom:2px solid #f5f0ee;width:48px;">Qty</th>`;

  const rows = items.map((it, idx) => {
    const bg = idx % 2 === 1 ? "#fdf8f8" : "#ffffff";
    const lineTotal = it.unitPrice != null ? it.unitPrice * it.quantity : null;
    const imgBlock = it.productImage
      ? `<img src="${it.productImage}" width="52" height="52" alt="${it.productName}" style="width:52px;height:52px;object-fit:cover;border-radius:3px;border:1px solid #f0e8e6;display:block;flex-shrink:0;" />`
      : `<div style="width:52px;height:52px;background:#fdf5f4;border:1px solid #f0e8e6;border-radius:3px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
           <span style="font-size:18px;">🧴</span>
         </div>`;

    const productCell = `
      <td style="padding:10px 12px;background:${bg};border-bottom:1px solid #f9f0ee;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align:top;padding-right:12px;">${imgBlock}</td>
          <td style="vertical-align:middle;">
            <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#e11d48;font-weight:600;">${it.productBrand}</p>
            <p style="margin:3px 0 0;font-size:13px;color:#1c1917;font-weight:500;line-height:1.4;">${
              it.productLink
                ? `<a href="${it.productLink}" style="color:#1c1917;text-decoration:none;">${it.productName}</a>`
                : it.productName
            }</p>
          </td>
        </tr></table>
      </td>`;

    if (hasPrices) {
      return `<tr>
        ${productCell}
        <td style="padding:12px;background:${bg};border-bottom:1px solid #f9f0ee;text-align:center;font-size:13px;color:#1c1917;">${it.quantity}</td>
        <td style="padding:12px;background:${bg};border-bottom:1px solid #f9f0ee;text-align:right;font-size:13px;color:#78716c;white-space:nowrap;">${unitPriceCell(it, sym)}</td>
        <td style="padding:12px;background:${bg};border-bottom:1px solid #f9f0ee;text-align:right;font-size:13px;color:#1c1917;font-weight:600;white-space:nowrap;">${lineTotalCell(it, lineTotal, sym)}</td>
      </tr>`;
    }
    return `<tr>
      ${productCell}
      <td style="padding:12px;background:${bg};border-bottom:1px solid #f9f0ee;text-align:center;font-size:13px;color:#1c1917;">${it.quantity}</td>
    </tr>`;
  }).join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #f5e8e6;border-radius:4px;overflow:hidden;">
      <thead><tr style="background:#fdf5f4;">${headerCells}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function invoiceSummaryBlock(items: PreOrderItemData[], deliveryCharge: number, sym: string, balancePaymentMethod?: "cod" | "bank") {
  const itemsWithPrice = items.filter((it) => it.unitPrice != null);
  if (itemsWithPrice.length === 0 && deliveryCharge === 0) return "";

  const subtotal = itemsWithPrice.reduce((sum, it) => sum + (it.unitPrice! * it.quantity), 0);
  const total = subtotal + deliveryCharge;
  const allPriced = itemsWithPrice.length === items.length;
  const deposit = Math.round(total * 0.25);
  const balance = total - deposit;
  const balanceLabel = balancePaymentMethod === "bank" ? "Bank Transfer" : balancePaymentMethod === "cod" ? "Cash on Delivery" : "";

  // Only the lines that carry a compare-at price contribute a saving.
  const savings = itemsWithPrice.reduce(
    (sum, it) => sum + lineSavings(it.unitPrice!, it.comparePrice, it.quantity),
    0
  );

  // Reads as arithmetic: original, less the saving, equals the subtotal.
  const originalRow = savings > 0 ? `
    <tr>
      <td style="padding:8px 16px;font-size:13px;color:#78716c;">Original price</td>
      <td style="padding:8px 16px;font-size:13px;color:#a8a29e;text-decoration:line-through;text-align:right;white-space:nowrap;">${fmt(subtotal + savings, sym)}</td>
    </tr>` : "";

  const savingsRow = savings > 0 ? `
    <tr>
      <td style="padding:8px 16px;font-size:13px;color:#b45309;">You saved</td>
      <td style="padding:8px 16px;font-size:13px;font-weight:600;color:#b45309;text-align:right;white-space:nowrap;">-${fmt(savings, sym)}</td>
    </tr>` : "";

  const subtotalRow = itemsWithPrice.length > 0 ? `
    <tr>
      <td style="padding:8px 16px;font-size:13px;color:#78716c;">Subtotal</td>
      <td style="padding:8px 16px;font-size:13px;color:#1c1917;text-align:right;white-space:nowrap;">${fmt(subtotal, sym)}</td>
    </tr>` : "";

  const deliveryRow = `
    <tr>
      <td style="padding:8px 16px;font-size:13px;color:#78716c;">Delivery Charge</td>
      <td style="padding:8px 16px;font-size:13px;color:#1c1917;text-align:right;white-space:nowrap;">${fmt(deliveryCharge, sym)}</td>
    </tr>`;

  const totalRow = itemsWithPrice.length > 0 ? `
    <tr style="background:#fff7f7;border-top:2px solid #fde8e8;">
      <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#1c1917;">${allPriced ? "Estimated Total" : "Estimated Total (partial)"}</td>
      <td style="padding:12px 16px;font-size:16px;font-weight:700;color:#e11d48;text-align:right;white-space:nowrap;">${fmt(total, sym)}</td>
    </tr>` : `
    <tr style="background:#fff7f7;border-top:2px solid #fde8e8;">
      <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#1c1917;">Delivery Charge</td>
      <td style="padding:12px 16px;font-size:16px;font-weight:700;color:#e11d48;text-align:right;white-space:nowrap;">${fmt(deliveryCharge, sym)}</td>
    </tr>`;

  // Payment breakdown — only meaningful when we have a total
  const paymentRows = itemsWithPrice.length > 0 ? `
    <tr>
      <td style="padding:8px 16px;font-size:13px;color:#78716c;">25% Deposit <span style="color:#a8a29e;">· Bank Transfer</span></td>
      <td style="padding:8px 16px;font-size:13px;color:#1c1917;text-align:right;white-space:nowrap;font-weight:600;">${fmt(deposit, sym)}</td>
    </tr>
    <tr>
      <td style="padding:8px 16px;font-size:13px;color:#78716c;">Balance${balanceLabel ? ` <span style="color:#a8a29e;">· ${balanceLabel}</span>` : ""}</td>
      <td style="padding:8px 16px;font-size:13px;color:#1c1917;text-align:right;white-space:nowrap;">${fmt(balance, sym)}</td>
    </tr>` : "";

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #f5e8e6;border-radius:4px;overflow:hidden;margin-top:4px;">
      <tbody>
        ${originalRow}
        ${savingsRow}
        ${subtotalRow}
        ${deliveryRow}
        ${totalRow}
        ${paymentRows}
      </tbody>
    </table>
    ${itemsWithPrice.length > 0 ? `<p style="margin:8px 0 0;font-size:11px;color:#a8a29e;">* A 25% deposit via bank transfer locks in your order after we confirm it (within 2 business days). The balance is paid via your selected method.</p>` : ""}
    ${!allPriced ? `<p style="margin:8px 0 0;font-size:11px;color:#a8a29e;">* Prices are based on current listed rates. Items marked "To be quoted" will be priced when our team sources them.</p>` : `<p style="margin:8px 0 0;font-size:11px;color:#a8a29e;">* Estimated total based on current listed prices. Final pricing confirmed within 48 hours.</p>`}`;
}

export async function sendPreOrderConfirmationToBuyer(data: PreOrderEmailData) {
  const sym = data.currencySymbol ?? "Rs.";
  const delivery = data.deliveryCharge ?? 0;
  const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  const html = layout(`
    <h1 style="margin:0 0 4px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1c1917;">
      Pre-order request received! ✨
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#78716c;line-height:1.7;">
      Hi ${data.customerName}, your pre-order request has been received. Our team will confirm pricing &amp; availability within 48 hours — no payment is taken until you approve.
    </p>

    <!-- Invoice Header -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff7f7;border:1px solid #fde8e8;border-radius:4px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#e11d48;font-weight:600;">Request Number</p>
          <p style="margin:4px 0 0;font-size:20px;font-family:monospace;color:#1c1917;font-weight:700;">${data.requestNumber}</p>
        </td>
        <td style="padding:16px 20px;text-align:right;">
          <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#78716c;font-weight:600;">Date</p>
          <p style="margin:4px 0 0;font-size:13px;color:#1c1917;">${now}</p>
          ${data.phoneNumber ? `<p style="margin:6px 0 0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#78716c;font-weight:600;margin-top:10px;">Phone</p><p style="margin:4px 0 0;font-size:13px;color:#1c1917;">${data.phoneNumber}</p>` : ""}
        </td>
      </tr>
    </table>

    <!-- Items Table -->
    <h3 style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#78716c;">
      Items Requested (${data.items.length})
    </h3>
    ${preOrderInvoiceTable(data.items, sym)}

    <!-- Invoice Summary -->
    ${delivery > 0 || data.items.some(it => it.unitPrice != null) ? `
    <div style="margin-top:12px;">
      ${invoiceSummaryBlock(data.items, delivery, sym, data.balancePaymentMethod)}
    </div>` : ""}

    ${data.notes ? `
    <div style="background:#faf9f8;border:1px solid #f0ebe9;border-radius:4px;padding:14px 16px;margin-top:20px;">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#78716c;font-weight:600;">Your Notes</p>
      <p style="margin:0;font-size:13px;color:#78716c;font-style:italic;">${data.notes}</p>
    </div>` : ""}

    <hr style="border:none;border-top:1px solid #f5f0ee;margin:24px 0;" />

    <h3 style="margin:0 0 12px;font-size:13px;font-weight:600;color:#1c1917;">What happens next?</h3>
    <ol style="margin:0;padding-left:20px;font-size:13px;color:#78716c;line-height:2.2;">
      <li>Our team reviews your request</li>
      <li>We check availability &amp; sourcing options from Korea</li>
      <li>We email you a confirmed price &amp; estimated arrival date</li>
      <li>You approve — then we import &amp; deliver</li>
    </ol>

    <p style="margin-top:20px;font-size:12px;color:#a8a29e;">
      Questions? <a href="mailto:seoulaurateam@gmail.com" style="color:#e11d48;">seoulaurateam@gmail.com</a>
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `Pre-order Request Received · ${data.requestNumber} — Seoul Aura`,
    html,
  });
}

// ─── 5. Pre-order notification → Admin ───────────────────────────────────────
export async function sendPreOrderNotificationToAdmin(data: PreOrderEmailData) {
  const sym = data.currencySymbol ?? "Rs.";
  const delivery = data.deliveryCharge ?? 0;

  const html = layout(`
    <h1 style="margin:0 0 4px;font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1c1917;">
      New Pre-order Request
    </h1>
    <p style="margin:0 0 24px;font-size:13px;color:#78716c;">A customer has submitted a pre-order request.</p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td style="font-size:12px;color:#78716c;padding:4px 0;width:120px;">Request #</td>
        <td style="font-size:13px;font-weight:700;font-family:monospace;color:#1c1917;">${data.requestNumber}</td>
      </tr>
      <tr>
        <td style="font-size:12px;color:#78716c;padding:4px 0;">Customer</td>
        <td style="font-size:13px;color:#1c1917;">${data.customerName}</td>
      </tr>
      <tr>
        <td style="font-size:12px;color:#78716c;padding:4px 0;">Email</td>
        <td style="font-size:13px;color:#e11d48;">${data.customerEmail}</td>
      </tr>
      ${data.phoneNumber ? `<tr><td style="font-size:12px;color:#78716c;padding:4px 0;">Phone</td><td style="font-size:13px;color:#1c1917;">${data.phoneNumber}</td></tr>` : ""}
    </table>

    <h3 style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#78716c;">
      Products Requested (${data.items.length})
    </h3>
    ${preOrderInvoiceTable(data.items, sym)}

    ${delivery > 0 || data.items.some(it => it.unitPrice != null) ? `
    <div style="margin-top:12px;">
      ${invoiceSummaryBlock(data.items, delivery, sym, data.balancePaymentMethod)}
    </div>` : "<div style='height:16px;'></div>"}

    ${data.notes ? `
    <div style="background:#faf9f8;border-radius:4px;padding:14px 16px;margin-top:16px;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#78716c;font-weight:600;">Customer Notes</p>
      <p style="margin:0;font-size:13px;color:#78716c;font-style:italic;">${data.notes}</p>
    </div>` : ""}

    <div style="margin-top:28px;text-align:center;">
      <a href="${SITE}/admin/pre-orders" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:12px 28px;border-radius:3px;letter-spacing:0.5px;">
        View in Admin Panel
      </a>
    </div>
  `);

  return resend.emails.send({
    from: FROM,
    to: ADMIN_TO,
    subject: `[Pre-order] ${data.items.length} item${data.items.length !== 1 ? "s" : ""} · ${data.customerName}`,
    html,
  });
}

// ─── Shared: bank transfer details for the 25% deposit ───────────────────────
const BANK_TRANSFER_DETAILS_HTML = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:10px;background:#faf9f8;border:1px solid #f0ebe8;border-radius:4px;overflow:hidden;">
    <tbody>
      <tr>
        <td colspan="2" style="padding:10px 16px 6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#78716c;font-weight:600;">Bank Transfer Details</td>
      </tr>
      <tr>
        <td style="padding:3px 16px;font-size:12px;color:#78716c;width:130px;">Account Name</td>
        <td style="padding:3px 16px;font-size:13px;color:#1c1917;font-weight:600;">H.M.W.B. Kulathunga</td>
      </tr>
      <tr>
        <td style="padding:3px 16px;font-size:12px;color:#78716c;">Bank</td>
        <td style="padding:3px 16px;font-size:13px;color:#1c1917;">Hatton National Bank (HNB) — Matale Branch</td>
      </tr>
      <tr>
        <td style="padding:3px 16px;font-size:12px;color:#78716c;">Account Number</td>
        <td style="padding:3px 16px;font-size:13px;color:#1c1917;font-family:monospace;font-weight:700;">065020379824</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:8px 16px 10px;border-top:1px solid #f0ebe8;">
          <p style="margin:8px 0 0;font-size:12px;color:#78716c;line-height:1.6;">
            Once transferred, please send the payment slip via WhatsApp to
            <a href="https://wa.me/94778362755" style="color:#e11d48;font-weight:600;text-decoration:none;"> +94 77 836 2755</a>
            so we can confirm your deposit quickly.
          </p>
        </td>
      </tr>
    </tbody>
  </table>`;

// ─── 6. Pre-order status update → Buyer ──────────────────────────────────────
const PRE_ORDER_STATUS_MESSAGES: Record<string, { headline: string; detail: string; emoji: string }> = {
  reviewing: {
    emoji: "🔍",
    headline: "We're reviewing your pre-order",
    detail: "Our team is looking into sourcing this product for you. We'll update you soon.",
  },
  availability: {
    emoji: "📋",
    headline: "Availability confirmed",
    detail: "We've checked what we can source for you and priced your order below. No payment is needed yet — we'll send payment details once your order is confirmed.",
  },
  confirmed: {
    emoji: "✅",
    headline: "Pre-order confirmed!",
    detail: "Your pre-order has been confirmed and we've started the sourcing process. We'll keep you updated every step of the way.",
  },
  fulfilled: {
    emoji: "🎁",
    headline: "Your pre-order has been fulfilled!",
    detail: "Great news — your pre-ordered product is ready and on its way to you. Thank you for your patience!",
  },
  done: {
    emoji: "🎉",
    headline: "Order completed — thank you!",
    detail: "Your order is complete and your payment has been received in full. Thank you so much for shopping with Seoul Aura — we truly appreciate your trust and we hope you love every piece.",
  },
  rejected: {
    emoji: "😔",
    headline: "We couldn't fulfill your pre-order",
    detail: "Unfortunately we were unable to source this product at this time. We're sorry for the inconvenience — please reach out if you'd like us to try again or suggest an alternative.",
  },
};

interface PreOrderStatusEmailData {
  requestNumber: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  status: string;
  estimatedPrice?: number;
  estimatedAvailability?: string;
  adminNotes?: string;
  items?: PreOrderItemData[];
  deliveryCharge?: number;
  currencySymbol?: string;
  balancePaymentMethod?: "cod" | "bank";
  depositPaid?: boolean;
}

export async function sendPreOrderStatusUpdateToBuyer(data: PreOrderStatusEmailData) {
  const msg = PRE_ORDER_STATUS_MESSAGES[data.status];
  if (!msg) return;

  const sym = data.currencySymbol ?? "Rs.";
  const delivery = data.deliveryCharge ?? 0;
  const visibility = paymentVisibility(data.status);
  const paymentComplete = isPaymentComplete(data.status);
  // Money stays hidden while we're still reviewing, and on rejected requests
  // where nothing is being fulfilled.
  const showInvoice =
    !!data.items?.length && data.status !== "rejected" && visibility !== "none";

  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:12px;">${msg.emoji}</div>
      <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1c1917;">${msg.headline}</h1>
      <p style="margin:0 auto;font-size:14px;color:#78716c;max-width:380px;line-height:1.7;">${msg.detail}</p>
    </div>

    <div style="background:#fff7f7;border:1px solid #fde8e8;border-radius:4px;padding:16px 20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#e11d48;font-weight:600;">Request Number</p>
      <p style="margin:4px 0 8px;font-size:18px;font-family:monospace;color:#1c1917;font-weight:700;">${data.requestNumber}</p>
      ${!showInvoice ? `<p style="margin:0;font-size:13px;color:#78716c;">${data.productName}</p>` : ""}
    </div>

    ${showInvoice ? `
      ${preOrderAvailabilityTable(data.items!, sym)}
      ${preOrderTotalsTable(
        data.items!,
        delivery,
        sym,
        data.balancePaymentMethod,
        data.depositPaid,
        paymentComplete ? "Total Paid" : "Estimated Total",
        visibility === "full",
        paymentComplete
      )}
      <div style="height:8px;"></div>
    ` : ""}

    ${data.estimatedAvailability ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#faf9f8;border-radius:4px;padding:16px;">
      <tr>
        <td style="font-size:12px;color:#78716c;padding:4px 0;">Estimated Availability</td>
        <td style="font-size:13px;color:#1c1917;text-align:right;">${data.estimatedAvailability}</td>
      </tr>
    </table>` : ""}

    ${!showInvoice && data.estimatedPrice && visibility !== "none" ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;background:#faf9f8;border-radius:4px;padding:16px;">
      <tr>
        <td style="font-size:12px;color:#78716c;padding:4px 0;width:140px;">Estimated Price</td>
        <td style="font-size:14px;font-weight:700;color:#1c1917;">${rupees(data.estimatedPrice)}</td>
      </tr>
    </table>` : ""}

    ${data.adminNotes ? `
    <div style="background:#faf9f8;border-radius:4px;padding:14px 16px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#78716c;font-weight:600;">Message from our team</p>
      <p style="margin:0;font-size:13px;color:#1c1917;line-height:1.7;">${data.adminNotes}</p>
    </div>` : ""}

    <hr style="border:none;border-top:1px solid #f5f0ee;margin:24px 0;" />

    <div style="text-align:center;">
      <a href="${SITE}/account" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:12px 28px;border-radius:3px;letter-spacing:0.5px;">
        View My Account
      </a>
    </div>

    <p style="margin-top:20px;font-size:12px;color:#a8a29e;text-align:center;">
      Questions? <a href="mailto:seoulaurateam@gmail.com" style="color:#e11d48;">seoulaurateam@gmail.com</a>
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `${msg.emoji} Pre-order Update · ${data.requestNumber} — Seoul Aura`,
    html,
  });
}

// ─── Shared: pre-order items table with availability badges ──────────────────
function preOrderAvailabilityTable(items: PreOrderItemData[], sym: string) {
  const available = items.filter((it) => it.availability !== "unavailable");
  const unavailable = items.filter((it) => it.availability === "unavailable");

  const itemRow = (it: PreOrderItemData, unavail: boolean) => {
    const lineTotal = it.unitPrice != null ? it.unitPrice * it.quantity : null;
    const repriced = it.previousUnitPrice != null && it.unitPrice != null && it.previousUnitPrice !== it.unitPrice;
    const cheaper = repriced && it.unitPrice! < it.previousUnitPrice!;
    const unitCell = unavail
      ? "—"
      : it.unitPrice == null
        ? '<span style="color:#a8a29e;">—</span>'
        : repriced
          ? `<span style="color:#a8a29e;text-decoration:line-through;">${fmt(it.previousUnitPrice!, sym)}</span><br/>
             <span style="color:${cheaper ? "#16a34a" : "#e11d48"};font-weight:700;">${fmt(it.unitPrice, sym)}</span>`
          : fmt(it.unitPrice, sym);
    const imgBlock = it.productImage
      ? `<img src="${it.productImage}" width="48" height="48" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:3px;border:1px solid #f0e8e6;display:block;${unavail ? "opacity:0.45;" : ""}" />`
      : `<div style="width:48px;height:48px;background:#fdf5f4;border:1px solid #f0e8e6;border-radius:3px;text-align:center;line-height:48px;${unavail ? "opacity:0.45;" : ""}">🧴</div>`;
    const badge = unavail
      ? `<span style="display:inline-block;font-size:9px;letter-spacing:1px;text-transform:uppercase;background:#f5f5f4;color:#a8a29e;border:1px solid #e7e5e4;border-radius:99px;padding:2px 8px;margin-top:4px;">Unavailable</span>`
      : `<span style="display:inline-block;font-size:9px;letter-spacing:1px;text-transform:uppercase;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:99px;padding:2px 8px;margin-top:4px;">Available</span>`;
    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f9f0ee;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align:top;padding-right:12px;">${imgBlock}</td>
          <td style="vertical-align:middle;">
            <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#e11d48;font-weight:600;">${it.productBrand}</p>
            <p style="margin:3px 0 0;font-size:13px;color:${unavail ? "#a8a29e" : "#1c1917"};font-weight:500;line-height:1.4;${unavail ? "text-decoration:line-through;" : ""}">${it.productName}</p>
            ${badge}
          </td>
        </tr></table>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f9f0ee;text-align:center;font-size:13px;color:${unavail ? "#a8a29e" : "#1c1917"};">${it.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f9f0ee;text-align:right;font-size:12px;line-height:1.5;color:${unavail ? "#a8a29e" : "#1c1917"};white-space:nowrap;">${unitCell}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f9f0ee;text-align:right;font-size:13px;color:${unavail ? "#a8a29e" : "#1c1917"};font-weight:600;white-space:nowrap;${unavail ? "text-decoration:line-through;" : ""}">${unavail ? "—" : (lineTotal != null ? fmt(lineTotal, sym) : '<span style="color:#a8a29e;">To be quoted</span>')}</td>
    </tr>`;
  };

  const rows = [...available.map((it) => itemRow(it, false)), ...unavailable.map((it) => itemRow(it, true))].join("");

  return `
    <h3 style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#78716c;">Items (${items.length})</h3>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #f5e8e6;border-radius:4px;overflow:hidden;">
      <thead><tr style="background:#fdf5f4;">
        <th style="padding:10px 12px;text-align:left;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#78716c;border-bottom:2px solid #f5f0ee;">Product</th>
        <th style="padding:10px 12px;text-align:center;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#78716c;border-bottom:2px solid #f5f0ee;width:40px;">Qty</th>
        <th style="padding:10px 12px;text-align:right;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#78716c;border-bottom:2px solid #f5f0ee;white-space:nowrap;">Unit Price</th>
        <th style="padding:10px 12px;text-align:right;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#78716c;border-bottom:2px solid #f5f0ee;">Amount</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${unavailable.length > 0 ? `<p style="margin:10px 0 0;font-size:12px;color:#a8a29e;line-height:1.6;">${unavailable.length} item${unavailable.length !== 1 ? "s are" : " is"} currently unavailable and ${unavailable.length !== 1 ? "have" : "has"} been removed from your total.</p>` : ""}`;
}

// ─── Shared: pre-order payment totals (only available items count) ───────────
function preOrderTotalsTable(
  items: PreOrderItemData[],
  delivery: number,
  sym: string,
  balancePaymentMethod?: "cod" | "bank",
  depositPaid?: boolean,
  totalLabel = "Estimated Total",
  /** `false` at the availability stage — prices are known but no deposit is due yet. */
  showDeposit = true,
  /** `true` once the order is done: everything is settled, never ask for money. */
  paymentComplete = false
) {
  const available = items.filter((it) => it.availability !== "unavailable");
  const availablePriced = available.filter((it) => it.unitPrice != null);
  const subtotal = availablePriced.reduce((s, it) => s + (it.unitPrice! * it.quantity), 0);
  const allAvailablePriced = available.length > 0 && availablePriced.length === available.length;
  const total = subtotal + delivery;
  const deposit = Math.round(total * 0.25);
  const balance = total - deposit;
  const balanceLabel = balancePaymentMethod === "bank" ? "Bank Transfer"
    : balancePaymentMethod === "cod" ? "Cash on Delivery" : "";

  const html = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #f5e8e6;border-radius:4px;overflow:hidden;margin-top:16px;">
      <tbody>
        <tr>
          <td style="padding:8px 16px;font-size:13px;color:#78716c;">Subtotal (available items)</td>
          <td style="padding:8px 16px;font-size:13px;color:#1c1917;text-align:right;white-space:nowrap;">${fmt(subtotal, sym)}</td>
        </tr>
        <tr>
          <td style="padding:8px 16px;font-size:13px;color:#78716c;">Delivery Charge</td>
          <td style="padding:8px 16px;font-size:13px;color:#1c1917;text-align:right;white-space:nowrap;">${fmt(delivery, sym)}</td>
        </tr>
        <tr style="background:#fff7f7;border-top:2px solid #fde8e8;">
          <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#1c1917;">${allAvailablePriced ? totalLabel : `${totalLabel} (partial)`}</td>
          <td style="padding:12px 16px;font-size:16px;font-weight:700;color:#e11d48;text-align:right;white-space:nowrap;">${fmt(total, sym)}</td>
        </tr>
        ${showDeposit ? `
        <tr>
          <td style="padding:8px 16px;font-size:13px;color:#78716c;">25% Deposit <span style="color:#a8a29e;">· Bank Transfer</span>${depositPaid || paymentComplete ? ' <span style="color:#16a34a;font-weight:600;">(Paid ✓)</span>' : ""}</td>
          <td style="padding:8px 16px;font-size:13px;color:#1c1917;text-align:right;white-space:nowrap;font-weight:600;">${fmt(deposit, sym)}</td>
        </tr>
        <tr>
          <td style="padding:8px 16px;font-size:13px;color:#78716c;">Balance${balanceLabel ? ` <span style="color:#a8a29e;">· ${balanceLabel}</span>` : ""}${paymentComplete ? ' <span style="color:#16a34a;font-weight:600;">(Paid ✓)</span>' : ""}</td>
          <td style="padding:8px 16px;font-size:13px;color:#1c1917;text-align:right;white-space:nowrap;">${fmt(balance, sym)}</td>
        </tr>` : ""}
      </tbody>
    </table>
    ${showDeposit && !depositPaid && !paymentComplete ? `<p style="margin:12px 0 0;font-size:12px;color:#78716c;line-height:1.7;">To lock in your order, please pay the <strong>25% deposit (${fmt(deposit, sym)}) via bank transfer</strong> using the details below.</p>${BANK_TRANSFER_DETAILS_HTML}` : ""}
    ${!showDeposit ? `<p style="margin:12px 0 0;font-size:12px;color:#78716c;line-height:1.7;">No payment is needed yet — we'll send payment instructions once your order is confirmed.</p>` : ""}`;

  return html;
}

// ─── Shared: unit-price revisions (old → new, with the reason) ───────────────
function preOrderPriceChangeTable(changes: PreOrderPriceChangeData[], sym: string) {
  if (!changes.length) return "";

  const rows = changes
    .map((c) => {
      const cheaper = c.previousUnitPrice != null && c.newUnitPrice < c.previousUnitPrice;
      const isNew = c.previousUnitPrice == null;
      const diff = c.previousUnitPrice != null ? c.newUnitPrice - c.previousUnitPrice : null;
      const diffLabel =
        diff == null
          ? ""
          : `<span style="font-size:11px;color:${cheaper ? "#16a34a" : "#e11d48"};">${cheaper ? "▼" : "▲"} ${fmt(Math.abs(diff), sym)} per unit</span>`;

      return `<tr>
        <td style="padding:14px 16px;border-bottom:1px solid #f9f0ee;">
          <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#e11d48;font-weight:600;">${c.productBrand}</p>
          <p style="margin:3px 0 8px;font-size:13px;color:#1c1917;font-weight:500;line-height:1.4;">${c.productName}</p>

          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
            <tr>
              <td style="padding:0 10px 0 0;">
                <p style="margin:0;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;">${isNew ? "Previous" : "Earlier price"}</p>
                <p style="margin:2px 0 0;font-size:14px;color:#a8a29e;${isNew ? "" : "text-decoration:line-through;"}">${isNew ? "Not yet quoted" : fmt(c.previousUnitPrice!, sym)}</p>
              </td>
              <td style="padding:0 10px;font-size:16px;color:#d6d3d1;">→</td>
              <td style="padding:0 0 0 10px;">
                <p style="margin:0;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;">New price</p>
                <p style="margin:2px 0 0;font-size:15px;font-weight:700;color:${cheaper ? "#16a34a" : "#e11d48"};">${fmt(c.newUnitPrice, sym)}</p>
              </td>
            </tr>
          </table>
          ${diffLabel}

          <div style="background:#faf9f8;border-left:3px solid #e11d48;border-radius:2px;padding:9px 12px;margin-top:10px;">
            <p style="margin:0 0 2px;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#78716c;font-weight:600;">Reason</p>
            <p style="margin:0;font-size:13px;color:#1c1917;line-height:1.6;">${c.reason}</p>
          </div>

          <p style="margin:8px 0 0;font-size:11px;color:#a8a29e;">
            Qty ${c.quantity} · New line total <strong style="color:#1c1917;">${fmt(c.newUnitPrice * c.quantity, sym)}</strong>${
              c.previousUnitPrice != null
                ? ` <span style="text-decoration:line-through;">${fmt(c.previousUnitPrice * c.quantity, sym)}</span>`
                : ""
            }
          </p>
        </td>
      </tr>`;
    })
    .join("");

  return `
    <h3 style="margin:24px 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#78716c;">Price ${changes.length !== 1 ? "changes" : "change"} (${changes.length})</h3>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #f5e8e6;border-radius:4px;overflow:hidden;">
      <tbody>${rows}</tbody>
    </table>`;
}

// ─── 7. Pre-order revision (price / availability / deposit) → Buyer ──────────
interface PreOrderRevisionEmailData {
  requestNumber: string;
  customerName: string;
  customerEmail: string;
  phoneNumber?: string;
  items: PreOrderItemData[];
  priceChanges?: PreOrderPriceChangeData[];
  deliveryCharge?: number;
  currencySymbol?: string;
  balancePaymentMethod?: "cod" | "bank";
  depositPaid?: boolean;
  reasons: ("availability" | "deposit" | "price")[];
  /** Drives whether the 25% deposit split is shown. */
  status?: string;
}

export async function sendPreOrderRevisionToBuyer(data: PreOrderRevisionEmailData) {
  const sym = data.currencySymbol ?? "Rs.";
  const delivery = data.deliveryCharge ?? 0;
  const showDeposit = paymentVisibility(data.status ?? "confirmed") === "full";
  const paidInFull = isPaymentComplete(data.status ?? "");
  const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  const reasons = data.reasons ?? [];
  const only = (r: "availability" | "deposit" | "price") => reasons.length === 1 && reasons[0] === r;
  const priceChanges = data.priceChanges ?? [];

  const headline = only("deposit")
    ? "Deposit received — your order is locked in! 🔒"
    : only("price")
      ? "A price on your pre-order has been updated 💷"
      : only("availability")
        ? "Your pre-order availability is updated 📋"
        : "Your pre-order has been updated 📋";

  const intro = only("deposit")
    ? "We've received your 25% deposit and your order is now locked in. Here's your updated summary."
    : reasons.includes("price")
      ? `We've revised the price of ${priceChanges.length !== 1 ? "some items" : "an item"} on your pre-order. The earlier and new prices are shown below, along with the reason and your updated totals.`
      : "We've reviewed your pre-order and updated item availability. Here's your revised summary and totals.";

  const depositBadge = data.depositPaid
    ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;padding:12px 16px;margin-bottom:20px;text-align:center;">
         <p style="margin:0;font-size:13px;color:#16a34a;font-weight:700;">✅ 25% Deposit Received — your order is locked in.</p>
       </div>`
    : "";

  const html = layout(`
    <h1 style="margin:0 0 4px;font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1c1917;">${headline}</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#78716c;line-height:1.7;">Hi ${data.customerName}, ${intro}</p>

    ${depositBadge}

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff7f7;border:1px solid #fde8e8;border-radius:4px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#e11d48;font-weight:600;">Request Number</p>
          <p style="margin:4px 0 0;font-size:18px;font-family:monospace;color:#1c1917;font-weight:700;">${data.requestNumber}</p>
        </td>
        <td style="padding:16px 20px;text-align:right;">
          <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#78716c;font-weight:600;">Updated</p>
          <p style="margin:4px 0 0;font-size:13px;color:#1c1917;">${now}</p>
        </td>
      </tr>
    </table>

    ${preOrderPriceChangeTable(priceChanges, sym)}

    ${preOrderAvailabilityTable(data.items, sym)}

    ${preOrderTotalsTable(data.items, delivery, sym, data.balancePaymentMethod, data.depositPaid, "Updated Total", showDeposit, paidInFull)}

    <div style="margin-top:24px;text-align:center;">
      <a href="${SITE}/account?tab=pre-orders" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:12px 28px;border-radius:3px;letter-spacing:0.5px;">
        View My Pre-Orders
      </a>
    </div>

    <p style="margin-top:20px;font-size:12px;color:#a8a29e;text-align:center;">
      Questions? <a href="mailto:seoulaurateam@gmail.com" style="color:#e11d48;">seoulaurateam@gmail.com</a>
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: only("price")
      ? `💷 Price Updated · Pre-order ${data.requestNumber} — Seoul Aura`
      : `📋 Pre-order Updated · ${data.requestNumber} — Seoul Aura`,
    html,
  });
}

// ─── 8. Pre-order — new product(s) added → Buyer ─────────────────────────────
interface PreOrderItemsAddedEmailData {
  requestNumber: string;
  customerName: string;
  customerEmail: string;
  phoneNumber?: string;
  addedItems: PreOrderItemData[];
  message: string;
  items: PreOrderItemData[];
  deliveryCharge?: number;
  currencySymbol?: string;
  balancePaymentMethod?: "cod" | "bank";
  depositPaid?: boolean;
  /** Drives whether the 25% deposit split is shown. */
  status?: string;
}

export async function sendPreOrderItemsAddedToBuyer(data: PreOrderItemsAddedEmailData) {
  const sym = data.currencySymbol ?? "Rs.";
  const delivery = data.deliveryCharge ?? 0;
  const showDeposit = paymentVisibility(data.status ?? "confirmed") === "full";
  const paidInFull = isPaymentComplete(data.status ?? "");
  const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const plural = data.addedItems.length !== 1;

  const html = layout(`
    <h1 style="margin:0 0 4px;font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1c1917;">
      New product${plural ? "s" : ""} added to your pre-order 🛍️
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#78716c;line-height:1.7;">
      Hi ${data.customerName}, our team has added the following item${plural ? "s" : ""} to your pre-order request.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff7f7;border:1px solid #fde8e8;border-radius:4px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#e11d48;font-weight:600;">Request Number</p>
          <p style="margin:4px 0 0;font-size:18px;font-family:monospace;color:#1c1917;font-weight:700;">${data.requestNumber}</p>
        </td>
        <td style="padding:16px 20px;text-align:right;">
          <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#78716c;font-weight:600;">Updated</p>
          <p style="margin:4px 0 0;font-size:13px;color:#1c1917;">${now}</p>
        </td>
      </tr>
    </table>

    <div style="background:#faf9f8;border-left:3px solid #e11d48;border-radius:2px;padding:14px 16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#78716c;font-weight:600;">Message from our team</p>
      <p style="margin:0;font-size:13px;color:#1c1917;line-height:1.7;">${data.message}</p>
    </div>

    <h3 style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#78716c;">
      Newly Added (${data.addedItems.length})
    </h3>
    ${preOrderInvoiceTable(data.addedItems, sym)}

    <div style="height:16px;"></div>

    ${preOrderAvailabilityTable(data.items, sym)}
    ${preOrderTotalsTable(data.items, delivery, sym, data.balancePaymentMethod, data.depositPaid, "Updated Total", showDeposit, paidInFull)}

    <div style="margin-top:24px;text-align:center;">
      <a href="${SITE}/account?tab=pre-orders" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:12px 28px;border-radius:3px;letter-spacing:0.5px;">
        View My Pre-Orders
      </a>
    </div>

    <p style="margin-top:20px;font-size:12px;color:#a8a29e;text-align:center;">
      Questions? <a href="mailto:seoulaurateam@gmail.com" style="color:#e11d48;">seoulaurateam@gmail.com</a>
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `🛍️ New product added · Pre-order ${data.requestNumber} — Seoul Aura`,
    html,
  });
}

// ─── 9. Marketing campaign (Notify) → Users / Notifiers ──────────────────────
interface CampaignEmailData {
  recipients: string[];
  subject: string;
  message: string;     // plain text / simple HTML; newlines become paragraphs
  images?: string[];   // absolute image URLs
  heading?: string;
}

function campaignHtml(message: string, images: string[], heading?: string) {
  const imageBlocks = images
    .filter(Boolean)
    .map(
      (src) =>
        `<img src="${src}" alt="" style="display:block;width:100%;max-width:520px;height:auto;border-radius:6px;margin:0 auto 16px;" />`
    )
    .join("");

  // Convert message text to paragraphs (blank line) + line breaks
  const body = message
    .split(/\n{2,}/)
    .map(
      (para) =>
        `<p style="margin:0 0 16px;font-size:14px;color:#44403c;line-height:1.8;">${para.replace(/\n/g, "<br/>")}</p>`
    )
    .join("");

  return layout(`
    ${heading ? `<h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1c1917;">${heading}</h1>` : ""}
    ${imageBlocks}
    ${body}
    <div style="margin-top:28px;text-align:center;">
      <a href="${SITE}/shop" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:12px 28px;border-radius:3px;letter-spacing:0.5px;">
        Shop Now
      </a>
    </div>
  `);
}

export async function sendCampaignEmail(data: CampaignEmailData) {
  const html = campaignHtml(data.message, data.images ?? [], data.heading);
  const recipients = Array.from(new Set(data.recipients.map((r) => r.trim().toLowerCase()).filter(Boolean)));

  let sent = 0;
  let failed = 0;
  const CHUNK = 20;

  for (let i = 0; i < recipients.length; i += CHUNK) {
    const chunk = recipients.slice(i, i + CHUNK);
    const results = await Promise.allSettled(
      chunk.map((to) =>
        resend.emails.send({ from: FROM, to, subject: data.subject, html })
      )
    );
    results.forEach((r) => {
      if (r.status === "fulfilled" && !(r.value as { error?: unknown })?.error) sent++;
      else failed++;
    });
  }

  return { sent, failed, total: recipients.length };
}
