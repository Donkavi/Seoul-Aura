"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Phone, ShieldCheck, Loader2, ArrowRight, LogOut } from "lucide-react";

export default function VerifyPhone({ redirectTo = "/account" }: { redirectTo?: string }) {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [phone, setPhone] = useState<string>((session?.user as { phone?: string })?.phone ?? "");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const sendCode = async () => {
    setError(""); setMsg(""); setSending(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send code");
      setCodeSent(true);
      setMsg(data.sent ? "Code sent! Check your messages." : "Code generated — ask the team if it didn't arrive.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    setError(""); setVerifying(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      await update(); // refresh JWT so phoneVerified becomes true
      router.replace(redirectTo);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="bg-rose-25/30 min-h-[80vh] flex items-center py-12">
      <div className="max-w-md mx-auto px-4 w-full">
        <div className="bg-white border border-ink-100 rounded-sm shadow-card p-8 lg:p-10">
          <div className="w-16 h-16 mx-auto bg-rose-50 rounded-full flex items-center justify-center mb-6 border border-rose-100">
            <ShieldCheck size={28} className="text-rose-600" />
          </div>
          <h1 className="font-display text-3xl text-ink-900 text-center mb-2">Verify your phone</h1>
          <p className="text-sm text-ink-500 text-center mb-8 leading-relaxed">
            For your security we verify every account with a one-time code. We&apos;ll send a 4-digit code to your number.
          </p>

          {/* Phone */}
          <div className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 flex items-center gap-1.5">
              <Phone size={12} /> Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={codeSent}
              placeholder="077 123 4567"
              className="input-field disabled:bg-ink-50 disabled:text-ink-500"
            />
            {codeSent && (
              <button
                onClick={() => { setCodeSent(false); setCode(""); setMsg(""); }}
                className="text-xs text-rose-600 hover:underline mt-1.5"
              >
                Change number
              </button>
            )}
          </div>

          {/* OTP */}
          {codeSent && (
            <div className="mb-4 animate-fade-in">
              <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                4-Digit Code
              </label>
              <input
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
              />
            </div>
          )}

          {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-sm p-3 mb-4">{error}</p>}
          {msg && !error && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-sm p-3 mb-4">{msg}</p>}

          {!codeSent ? (
            <button
              onClick={sendCode}
              disabled={sending || !phone.trim()}
              className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {sending ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : <>Send Code <ArrowRight size={15} /></>}
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={verify}
                disabled={verifying || code.length < 4}
                className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {verifying ? <><Loader2 size={15} className="animate-spin" /> Verifying…</> : <>Verify &amp; Continue</>}
              </button>
              <button
                onClick={sendCode}
                disabled={sending}
                className="btn-ghost w-full text-xs"
              >
                {sending ? "Resending…" : "Resend code"}
              </button>
            </div>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-6 w-full text-xs text-ink-400 hover:text-rose-600 inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
