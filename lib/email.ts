import { Resend } from "resend";

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
            <td style="background:linear-gradient(135deg,#e11d48,#be123c);padding:28px 40px;text-align:center;border-radius:6px 6px 0 0;">
              <a href="${SITE}" style="text-decoration:none;">
                <span style="font-family:Georgia,serif;font-size:26px;font-weight:400;color:#ffffff;letter-spacing:4px;text-transform:uppercase;">
                  Seoul <span style="color:#fbcfda;">Aura</span>
                </span>
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

function totalsBlock(subtotal: number, shippingFee: number, discount: number, total: number) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
      ${subtotal !== total ? `
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
      </tr>` : ""}` : ""}
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
    ${totalsBlock(data.subtotal, data.shippingFee, data.discount, data.total)}

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
    ${totalsBlock(data.subtotal, data.shippingFee, data.discount, data.total)}

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
  quantity: number;
}

interface PreOrderEmailData {
  requestNumber: string;
  customerName: string;
  customerEmail: string;
  items: PreOrderItemData[];
  origin: string;
  notes?: string;
}

function preOrderItemsBlock(items: PreOrderItemData[]) {
  const rows = items.map((it) => `
    <div style="padding:12px 0;border-bottom:1px solid #f5f0ee;">
      <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#e11d48;font-weight:600;">${it.productBrand}</p>
      <p style="margin:3px 0 0;font-size:14px;color:#1c1917;">${it.productName}</p>
      <p style="margin:5px 0 0;font-size:12px;color:#78716c;">Qty: <strong>${it.quantity}</strong>${
        it.productLink ? ` · <a href="${it.productLink}" style="color:#e11d48;">reference link</a>` : ""
      }</p>
    </div>`).join("");
  return `<div style="border-top:1px solid #f5f0ee;">${rows}</div>`;
}

export async function sendPreOrderConfirmationToBuyer(data: PreOrderEmailData) {
  const html = layout(`
    <h1 style="margin:0 0 4px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1c1917;">
      Pre-order request received! ✨
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#78716c;line-height:1.7;">
      Hi ${data.customerName}, we've received your pre-order request. Our team will review it and get back to you within 2 business days with pricing and availability.
    </p>

    <div style="background:#fff7f7;border:1px solid #fde8e8;border-radius:4px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#e11d48;font-weight:600;">Request Number</p>
      <p style="margin:4px 0 0;font-size:18px;font-family:monospace;color:#1c1917;font-weight:700;">${data.requestNumber}</p>
    </div>

    <h3 style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#78716c;">
      Products Requested (${data.items.length})
    </h3>
    ${preOrderItemsBlock(data.items)}
    <div style="height:20px;"></div>

    ${data.notes ? `
    <div style="background:#faf9f8;border-radius:4px;padding:14px 16px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#78716c;font-weight:600;">Your Notes</p>
      <p style="margin:0;font-size:13px;color:#78716c;font-style:italic;">${data.notes}</p>
    </div>` : ""}

    <hr style="border:none;border-top:1px solid #f5f0ee;margin:24px 0;" />

    <h3 style="margin:0 0 12px;font-size:13px;font-weight:600;color:#1c1917;">What happens next?</h3>
    <ol style="margin:0;padding-left:20px;font-size:13px;color:#78716c;line-height:2;">
      <li>Our team reviews your request</li>
      <li>We check availability &amp; sourcing options from Korea</li>
      <li>We'll email you with pricing &amp; an estimated arrival date</li>
      <li>You confirm and we import it for you</li>
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
    </table>

    <h3 style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#78716c;">
      Products Requested (${data.items.length})
    </h3>
    ${preOrderItemsBlock(data.items)}
    <div style="height:20px;"></div>

    ${data.notes ? `
    <div style="background:#faf9f8;border-radius:4px;padding:14px 16px;margin-bottom:20px;">
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

// ─── 6. Pre-order status update → Buyer ──────────────────────────────────────
const PRE_ORDER_STATUS_MESSAGES: Record<string, { headline: string; detail: string; emoji: string }> = {
  reviewing: {
    emoji: "🔍",
    headline: "We're reviewing your pre-order",
    detail: "Our team is looking into sourcing this product for you. We'll update you soon.",
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
}

export async function sendPreOrderStatusUpdateToBuyer(data: PreOrderStatusEmailData) {
  const msg = PRE_ORDER_STATUS_MESSAGES[data.status];
  if (!msg) return;

  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:12px;">${msg.emoji}</div>
      <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1c1917;">${msg.headline}</h1>
      <p style="margin:0 auto;font-size:14px;color:#78716c;max-width:380px;line-height:1.7;">${msg.detail}</p>
    </div>

    <div style="background:#fff7f7;border:1px solid #fde8e8;border-radius:4px;padding:16px 20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#e11d48;font-weight:600;">Request Number</p>
      <p style="margin:4px 0 8px;font-size:18px;font-family:monospace;color:#1c1917;font-weight:700;">${data.requestNumber}</p>
      <p style="margin:0;font-size:13px;color:#78716c;">${data.productName}</p>
    </div>

    ${data.estimatedPrice || data.estimatedAvailability ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;background:#faf9f8;border-radius:4px;padding:16px;">
      ${data.estimatedPrice ? `<tr>
        <td style="font-size:12px;color:#78716c;padding:4px 0;width:140px;">Estimated Price</td>
        <td style="font-size:14px;font-weight:700;color:#1c1917;">${rupees(data.estimatedPrice)}</td>
      </tr>` : ""}
      ${data.estimatedAvailability ? `<tr>
        <td style="font-size:12px;color:#78716c;padding:4px 0;">Estimated Availability</td>
        <td style="font-size:13px;color:#1c1917;">${data.estimatedAvailability}</td>
      </tr>` : ""}
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
