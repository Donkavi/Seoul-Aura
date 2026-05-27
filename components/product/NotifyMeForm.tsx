"use client";

import { useState } from "react";
import { Bell, Check, AlertCircle, Mail, Sparkles } from "lucide-react";

export default function NotifyMeForm({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [showNameField, setShowNameField] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "duplicate" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/stock-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email: email.trim(), name: name.trim() || undefined }),
      });
      const data = await res.json();

      if (data.duplicate) {
        setStatus("duplicate");
      } else if (res.ok) {
        setStatus("success");
      } else {
        throw new Error(data.error ?? "Failed");
      }
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 border-2 border-rose-200 rounded-sm p-6 text-center animate-fade-up">
        <div className="w-14 h-14 mx-auto bg-rose-600 rounded-full flex items-center justify-center mb-3">
          <Check size={26} className="text-white" />
        </div>
        <h4 className="font-display text-xl text-ink-900 mb-1">You're on the list!</h4>
        <p className="text-sm text-ink-600 leading-relaxed">
          We'll email <strong>{email}</strong> the moment{" "}
          <span className="italic">{productName}</span> is back in stock.
        </p>
        <button
          onClick={() => {
            setStatus("idle");
            setEmail("");
            setName("");
          }}
          className="mt-4 text-xs text-rose-600 hover:underline"
        >
          Notify a different email
        </button>
      </div>
    );
  }

  if (status === "duplicate") {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-sm p-5 text-center">
        <Bell size={22} className="mx-auto text-rose-600 mb-2" />
        <p className="text-sm font-medium text-ink-900">You're already on the waitlist</p>
        <p className="text-xs text-ink-500 mt-1">
          We have <strong>{email}</strong> noted for this product. Hang tight!
        </p>
        <button
          onClick={() => {
            setStatus("idle");
            setEmail("");
          }}
          className="mt-3 text-xs text-rose-600 hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-rose-50 via-white to-rose-50/50 border-2 border-rose-300/60 rounded-sm p-5 lg:p-6 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-200/40 rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-rose-600 flex items-center justify-center flex-shrink-0">
            <Bell size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-rose-600 font-bold mb-0.5">
              Sold Out · Restock Alert
            </p>
            <h3 className="font-display text-lg lg:text-xl text-ink-900 leading-tight">
              Notify me when it's back
            </h3>
            <p className="text-xs text-ink-600 mt-1 leading-relaxed">
              Drop your email and we'll send you a personal heads-up the moment this product is
              available again. No spam, just the alert.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2 border border-ink-200 bg-white px-3.5 py-3 focus-within:border-rose-400 transition-colors">
            <Mail size={14} className="text-ink-400 flex-shrink-0" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>

          {showNameField && (
            <div className="flex items-center gap-2 border border-ink-200 bg-white px-3.5 py-3 focus-within:border-rose-400 transition-colors animate-fade-in">
              <Sparkles size={14} className="text-ink-400 flex-shrink-0" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
          )}

          {!showNameField && (
            <button
              type="button"
              onClick={() => setShowNameField(true)}
              className="text-xs text-rose-600 hover:underline"
            >
              + Add your name
            </button>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-100 border border-rose-200 rounded-sm p-2.5">
              <AlertCircle size={12} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-ink-900 hover:bg-rose-600 text-white font-medium py-3 text-sm tracking-wide transition-all duration-300 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {status === "submitting" ? (
              "Adding you…"
            ) : (
              <>
                <Bell size={14} /> Notify Me When Available
              </>
            )}
          </button>

          <p className="text-[10px] text-ink-500 text-center leading-relaxed">
            ✦ One-time email · We won't share your address · Unsubscribe anytime
          </p>
        </form>
      </div>
    </div>
  );
}
