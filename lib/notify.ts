/**
 * Notify.lk OTP delivery.
 *
 * Env vars (set in .env.local and Vercel):
 *   NOTIFY_LK_USER_ID    – your Notify.lk user id
 *   NOTIFY_LK_API_KEY    – your Notify.lk API key
 *   NOTIFY_LK_SENDER_ID  – approved sender id (defaults to "NotifyDEMO" for testing)
 *
 * If creds are missing, the OTP is logged to the server console instead of sent —
 * handy for local dev before the gateway is configured.
 */

const NOTIFY_SEND_URL = "https://app.notify.lk/api/v1/send";

/** Normalise a Sri Lankan number to Notify.lk format: 947XXXXXXXX (no +, leading 94). */
export function normalizeLkPhone(raw: string): string {
  let p = (raw || "").replace(/\D/g, "");
  if (p.startsWith("0")) p = "94" + p.slice(1);
  else if (p.startsWith("94")) {
    /* already country-coded */
  } else if (p.length === 9) p = "94" + p; // bare 7XXXXXXXX
  return p;
}

/** Generate a 4-digit OTP code. */
export function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/** Send the OTP message via Notify.lk. Returns true on success. */
export async function sendOtp(phone: string, code: string): Promise<boolean> {
  const userId = process.env.NOTIFY_LK_USER_ID;
  const apiKey = process.env.NOTIFY_LK_API_KEY;
  const senderId = process.env.NOTIFY_LK_SENDER_ID || "NotifyDEMO";
  const to = normalizeLkPhone(phone);
  const message = `Your Seoul Aura verification code is ${code}. It expires in 5 minutes. Do not share this code with anyone.`;

  if (!userId || !apiKey) {
    console.warn(`[notify] Missing NOTIFY_LK_USER_ID / NOTIFY_LK_API_KEY. OTP for ${to} is: ${code}`);
    return false;
  }

  const params = new URLSearchParams({
    user_id: userId,
    api_key: apiKey,
    sender_id: senderId,
    to,
    message,
  });

  try {
    const res = await fetch(`${NOTIFY_SEND_URL}?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (data?.status === "success") return true;
    console.error("[notify] send failed:", data);
    return false;
  } catch (err) {
    console.error("[notify] send error:", err);
    return false;
  }
}
