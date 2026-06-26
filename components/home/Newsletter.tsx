"use client";

import { useState } from "react";
import { Mail, Check } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/notifiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "newsletter" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setSubmitted(true);
      setTimeout(() => {
        setEmail("");
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-rose-50 py-14 lg:py-16">
      <div className="max-w-3xl mx-auto px-4 lg:px-8 text-center">
        <Mail size={28} className="mx-auto text-rose-600 mb-4" strokeWidth={1.5} />
        <h2 className="font-display text-3xl lg:text-4xl text-ink-900 mb-3">
          Subscribe & be the first to glow
        </h2>
        <p className="text-sm text-ink-500 mb-6 max-w-md mx-auto">
          New releases, special offers, and curated stories — straight to your inbox.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="flex-1 bg-white border border-ink-200 rounded-sm px-4 py-3 text-sm font-body focus:outline-none focus:border-rose-400"
          />
          <button
            type="submit"
            disabled={submitted || loading}
            className="btn-primary disabled:bg-ink-700 inline-flex items-center justify-center gap-2"
          >
            {submitted ? (
              <>
                <Check size={16} /> Subscribed
              </>
            ) : loading ? (
              "Subscribing…"
            ) : (
              "Subscribe"
            )}
          </button>
        </form>
        {error && <p className="text-xs text-rose-600 mt-2">{error}</p>}
        {submitted && <p className="text-xs text-green-600 mt-2">You&apos;re on the list — thanks for subscribing!</p>}
      </div>
    </section>
  );
}
