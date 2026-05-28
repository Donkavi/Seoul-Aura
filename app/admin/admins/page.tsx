"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Trash2, Shield, Check, X } from "lucide-react";

interface Admin {
  _id: string;
  email: string;
  name?: string;
  addedBy: string;
  createdAt: string;
}

export default function AdminsPage() {
  const { data: session } = useSession();
  const currentEmail = session?.user?.email?.toLowerCase() ?? "";

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetch("/api/admins").then((r) => r.json());
      setAdmins(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addAdmin = async () => {
    if (!newEmail.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim(), name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); return; }
      setNewEmail("");
      setNewName("");
      setAdding(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const removeAdmin = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} as admin?`)) return;
    const res = await fetch(`/api/admins/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error"); return; }
    await load();
  };

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">Access Control</p>
          <h1 className="font-display text-4xl text-ink-900">Admin Users</h1>
          <p className="text-sm text-ink-500 mt-1">
            Manage who has access to this admin panel.
          </p>
        </div>
        <button
          onClick={() => { setAdding(true); setError(""); }}
          className="inline-flex items-center gap-2 bg-ink-900 text-white px-5 py-2.5 text-sm hover:bg-rose-600 transition-colors"
        >
          <Plus size={15} /> Add Admin
        </button>
      </header>

      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
        {/* Add form */}
        {adding && (
          <div className="border-b border-ink-100 bg-rose-25/30 p-4">
            <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-3">New Admin</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Google Email *</label>
                <input
                  autoFocus
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAdmin()}
                  placeholder="admin@gmail.com"
                  className="w-full border border-ink-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Display Name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAdmin()}
                  placeholder="e.g. Jane (optional)"
                  className="w-full border border-ink-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                />
              </div>
            </div>
            <p className="text-xs text-ink-500 mb-3">
              The user must sign in with this exact Google email to gain admin access.
              They will need to sign out and back in after being added.
            </p>
            <div className="flex gap-2">
              <button
                onClick={addAdmin}
                disabled={saving || !newEmail.trim()}
                className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-xs px-4 py-2 hover:bg-rose-700 disabled:opacity-60 transition-colors"
              >
                <Check size={12} /> {saving ? "Saving…" : "Grant Access"}
              </button>
              <button
                onClick={() => { setAdding(false); setNewEmail(""); setNewName(""); setError(""); }}
                className="inline-flex items-center gap-1.5 border border-ink-200 text-ink-700 text-xs px-4 py-2 hover:bg-ink-50 transition-colors"
              >
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        )}

        <table className="w-full">
          <thead className="bg-ink-50 border-b border-ink-100">
            <tr>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Email</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Name</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Added By</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Added On</th>
              <th className="text-right p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-sm text-ink-400">Loading…</td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16">
                  <Shield size={32} className="mx-auto mb-3 text-ink-300" />
                  <p className="text-sm text-ink-500">No admins in the database yet.</p>
                  <p className="text-xs text-ink-400 mt-1">
                    The bootstrap admin (set via ADMIN_EMAIL env) always has access.
                  </p>
                </td>
              </tr>
            ) : (
              admins.map((a) => {
                const isSelf = a.email === currentEmail;
                return (
                  <tr key={a._id} className="border-b border-ink-50 hover:bg-rose-25/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink-900">{a.email}</span>
                        {isSelf && (
                          <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">You</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-ink-600">{a.name || "—"}</td>
                    <td className="p-4 text-sm text-ink-500">{a.addedBy}</td>
                    <td className="p-4 text-xs text-ink-400">
                      {new Date(a.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => removeAdmin(a._id, a.email)}
                        disabled={isSelf}
                        title={isSelf ? "Cannot remove yourself" : "Remove admin"}
                        className="p-2 hover:bg-rose-50 rounded text-ink-400 hover:text-rose-600 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 bg-ink-50 border border-ink-100 rounded-sm p-4 text-sm text-ink-600">
        <p className="font-medium text-ink-800 mb-1">How admin access works</p>
        <p>
          Admin access is granted by Google email. When an admin signs in with Google their
          token is checked against this list. If removed, they lose access on their next sign-in.
          The bootstrap admin set via <code className="bg-white px-1.5 py-0.5 rounded text-rose-700 text-xs">ADMIN_EMAIL</code>{" "}
          env var always has access regardless of this list.
        </p>
      </div>
    </div>
  );
}
