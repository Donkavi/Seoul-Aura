"use client";

import { useEffect, useState } from "react";
import {
  Send,
  Users,
  Mail,
  Trash2,
  Search,
  Loader2,
  CheckCircle,
  X,
} from "lucide-react";
import { cn, relativeDate } from "@/lib/utils";

interface Notifier {
  _id: string;
  email: string;
  source: string;
  active: boolean;
  createdAt: string;
}

type Audience = "users" | "notifiers" | "both";

export default function AdminNotifyPage() {
  // Compose state
  const [heading, setHeading] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [audience, setAudience] = useState<Audience>("both");

  const [counts, setCounts] = useState({ users: 0, notifiers: 0 });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Notifier list
  const [notifiers, setNotifiers] = useState<Notifier[]>([]);
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);

  const images = imagesText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);

  const loadCounts = () => {
    fetch("/api/notify/send")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setCounts({ users: d.users ?? 0, notifiers: d.notifiers ?? 0 }); })
      .catch(() => {});
  };

  const loadNotifiers = () => {
    setLoadingList(true);
    fetch(`/api/notifiers?search=${encodeURIComponent(search)}&limit=500`)
      .then((r) => r.json())
      .then((d) => setNotifiers(d.notifiers ?? []))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  };

  useEffect(() => { loadCounts(); }, []);
  useEffect(() => {
    const t = setTimeout(loadNotifiers, 250);
    return () => clearTimeout(t);
  }, [search]);

  const recipientCount =
    audience === "users" ? counts.users
    : audience === "notifiers" ? counts.notifiers
    : counts.users + counts.notifiers; // upper bound (dedup happens server-side)

  const send = async () => {
    setSending(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/notify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heading, subject, message, images, audience }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send.");
      setResult({ sent: data.sent, failed: data.failed, total: data.total });
      setConfirmOpen(false);
    } catch (err) {
      setError((err as Error).message);
      setConfirmOpen(false);
    } finally {
      setSending(false);
    }
  };

  const removeNotifier = async (id: string) => {
    if (!confirm("Remove this subscriber?")) return;
    await fetch(`/api/notifiers/${id}`, { method: "DELETE" });
    loadNotifiers();
    loadCounts();
  };

  const canSend = subject.trim() && message.trim() && recipientCount > 0;

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">Email Campaigns</p>
        <h1 className="font-display text-4xl text-ink-900">Notify</h1>
        <p className="text-sm text-ink-500 mt-1">Draft an email, attach images, and send to your customers and subscribers.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Composer */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-ink-100 rounded-sm p-6 space-y-4">
            <h2 className="font-display text-xl text-ink-900">Compose</h2>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1.5">Heading (optional)</label>
              <input value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="e.g. New K-Beauty Drop is Here!" className="input-field" />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1.5">Subject *</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" className="input-field" />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1.5">Message *</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} placeholder="Write your message… Leave a blank line between paragraphs." className="input-field resize-none" />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1.5">Image URLs (one per line or comma-separated)</label>
              <textarea value={imagesText} onChange={(e) => setImagesText(e.target.value)} rows={3} placeholder="https://…/banner.jpg" className="input-field resize-none font-mono text-xs" />
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt="" className="w-16 h-16 object-cover rounded-sm border border-ink-100"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Audience */}
          <div className="bg-white border border-ink-100 rounded-sm p-6 space-y-3">
            <h2 className="font-display text-xl text-ink-900">Recipients</h2>
            <div className="grid sm:grid-cols-3 gap-2.5">
              {([
                { key: "users", label: "Users", desc: "Registered accounts", count: counts.users, icon: Users },
                { key: "notifiers", label: "Notifiers", desc: "Newsletter subscribers", count: counts.notifiers, icon: Mail },
                { key: "both", label: "Both", desc: "Everyone (deduped)", count: counts.users + counts.notifiers, icon: Send },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setAudience(opt.key)}
                  className={cn(
                    "text-left p-3.5 border rounded-sm transition-colors",
                    audience === opt.key ? "border-rose-500 bg-rose-50/60 ring-1 ring-rose-300" : "border-ink-200 hover:border-rose-300"
                  )}
                >
                  <opt.icon size={16} className={audience === opt.key ? "text-rose-600" : "text-ink-400"} />
                  <p className="text-sm font-medium text-ink-900 mt-1.5">{opt.label}</p>
                  <p className="text-[11px] text-ink-500">{opt.desc}</p>
                  <p className="text-xs font-semibold text-rose-600 mt-1">{opt.count.toLocaleString()} recipient{opt.count !== 1 ? "s" : ""}</p>
                </button>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-sm p-3">
                <X size={14} /> {error}
              </div>
            )}
            {result && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-sm p-3">
                <CheckCircle size={14} /> Sent to {result.sent} recipient{result.sent !== 1 ? "s" : ""}{result.failed > 0 && ` · ${result.failed} failed`}.
              </div>
            )}

            <button
              onClick={() => setConfirmOpen(true)}
              disabled={!canSend || sending}
              className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={15} /> Send Campaign
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-ink-100 rounded-sm p-5 sticky top-6">
            <p className="text-[10px] uppercase tracking-widest text-ink-500 font-semibold mb-3">Preview</p>
            <div className="border border-ink-100 rounded-sm overflow-hidden">
              <div style={{ background: "linear-gradient(135deg,#e11d48,#be123c)" }} className="py-4 text-center">
                <span className="text-white font-display tracking-[0.2em] text-sm uppercase">Seoul Aura</span>
              </div>
              <div className="p-4 space-y-3">
                {heading && <p className="font-display text-lg text-ink-900">{heading}</p>}
                {images.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" className="w-full rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ))}
                <p className="text-xs text-ink-600 whitespace-pre-wrap leading-relaxed">{message || "Your message will appear here…"}</p>
                <div className="text-center pt-2">
                  <span className="inline-block bg-rose-600 text-white text-xs px-5 py-2 rounded-sm">Shop Now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifiers list */}
      <div className="mt-10 bg-white border border-ink-100 rounded-sm overflow-hidden">
        <div className="border-b border-ink-100 p-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-xl text-ink-900">Newsletter Subscribers</h2>
            <p className="text-xs text-ink-500">{counts.notifiers} active subscriber{counts.notifiers !== 1 ? "s" : ""}</p>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email…" className="bg-ink-50 border-0 rounded-sm pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300 w-64" />
          </div>
        </div>

        {loadingList ? (
          <div className="p-12 text-center text-sm text-ink-400">Loading…</div>
        ) : notifiers.length === 0 ? (
          <div className="p-12 text-center">
            <Mail size={28} className="mx-auto mb-3 text-ink-300" />
            <p className="text-sm text-ink-500">No subscribers yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-ink-50 border-b border-ink-100">
              <tr>
                <th className="text-left p-3 px-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Email</th>
                <th className="text-left p-3 text-xs uppercase tracking-widest text-ink-500 font-semibold">Source</th>
                <th className="text-left p-3 text-xs uppercase tracking-widest text-ink-500 font-semibold">Subscribed</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {notifiers.map((n) => (
                <tr key={n._id} className="border-b border-ink-50 hover:bg-rose-25/30">
                  <td className="p-3 px-4 text-sm text-ink-900">{n.email}</td>
                  <td className="p-3 text-xs text-ink-500 capitalize">{n.source}</td>
                  <td className="p-3 text-xs text-ink-500">{relativeDate(n.createdAt)}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => removeNotifier(n._id)} className="text-ink-400 hover:text-rose-600 p-1">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={() => !sending && setConfirmOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <Send size={20} className="text-rose-600" />
            </div>
            <h3 className="font-display text-xl text-ink-900 mb-2">Send this campaign?</h3>
            <p className="text-sm text-ink-600 leading-relaxed mb-1">
              You&apos;re about to email <strong>{recipientCount.toLocaleString()}</strong> {audience === "both" ? "users & subscribers (deduplicated)" : audience}.
            </p>
            <p className="text-xs text-ink-400 mb-5">Subject: &ldquo;{subject}&rdquo;</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmOpen(false)} disabled={sending} className="btn-outline flex-1 disabled:opacity-60">Cancel</button>
              <button onClick={send} disabled={sending} className="btn-primary flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-60">
                {sending ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <>Confirm &amp; Send</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
