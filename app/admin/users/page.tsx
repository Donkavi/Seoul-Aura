"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, Search, Trash2, ChevronDown } from "lucide-react";
import { relativeDate, cn } from "@/lib/utils";

interface User {
  _id: string;
  name: string;
  email: string;
  subscriptionStatus: "none" | "active" | "paused" | "cancelled";
  subscriptionPlan?: string;
  createdAt: string;
}

type SubStatus = User["subscriptionStatus"];

const SUB_STYLES: Record<SubStatus, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  paused: "bg-gold-50 text-gold-700 border-gold-200",
  cancelled: "bg-ink-100 text-ink-500 border-ink-200",
  none: "bg-ink-50 text-ink-500 border-ink-200",
};

type FilterTab = "all" | SubStatus;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetch("/api/users?limit=200").then((r) => r.json());
      setUsers(data.users ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const changeStatus = async (id: string, status: SubStatus) => {
    setUpdating(id);
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, subscriptionStatus: status } : u)));
    try {
      await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionStatus: status }),
      });
    } catch {
      load();
    } finally {
      setUpdating(null);
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setUsers((prev) => prev.filter((u) => u._id !== id));
    await fetch(`/api/users/${id}`, { method: "DELETE" });
  };

  const filtered = useMemo(() => {
    let list = users;
    if (tab !== "all") list = list.filter((u) => u.subscriptionStatus === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, tab, search]);

  const counts = useMemo(() => ({
    all: users.length,
    active: users.filter((u) => u.subscriptionStatus === "active").length,
    paused: users.filter((u) => u.subscriptionStatus === "paused").length,
    cancelled: users.filter((u) => u.subscriptionStatus === "cancelled").length,
    none: users.filter((u) => u.subscriptionStatus === "none").length,
  }), [users]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "active", label: `Active (${counts.active})` },
    { key: "paused", label: `Paused (${counts.paused})` },
    { key: "cancelled", label: `Cancelled (${counts.cancelled})` },
    { key: "none", label: `No Subscription (${counts.none})` },
  ];

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">
          Customer Accounts
        </p>
        <h1 className="font-display text-4xl text-ink-900">Users</h1>
        <p className="text-sm text-ink-500 mt-1">{users.length} registered customers</p>
      </header>

      <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
        <div className="border-b border-ink-100 p-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 flex-wrap">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap",
                  tab === t.key ? "bg-rose-600 text-white" : "text-ink-700 hover:bg-ink-50"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="ml-auto relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-ink-50 border-0 rounded-sm pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300 w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-ink-400">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Users size={32} className="mx-auto mb-3 text-ink-300" />
            <p className="font-display text-xl text-ink-900 mb-1">No users found</p>
            <p className="text-sm text-ink-500">Try a different filter or search.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-ink-50 border-b border-ink-100">
              <tr>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Customer</th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Subscription</th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Plan</th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Joined</th>
                <th className="text-right p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} className="border-b border-ink-50 hover:bg-rose-25/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-300 to-rose-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-900">{u.name}</p>
                        <p className="text-xs text-ink-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="relative inline-flex items-center">
                      <select
                        value={u.subscriptionStatus}
                        disabled={updating === u._id}
                        onChange={(e) => changeStatus(u._id, e.target.value as SubStatus)}
                        className={cn(
                          "appearance-none text-xs font-semibold capitalize pl-2.5 pr-7 py-1.5 rounded-sm border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-60",
                          SUB_STYLES[u.subscriptionStatus]
                        )}
                      >
                        {(["none", "active", "paused", "cancelled"] as SubStatus[]).map((s) => (
                          <option key={s} value={s} className="bg-white text-ink-900">
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={11} className="absolute right-2 pointer-events-none opacity-60" />
                    </div>
                  </td>
                  <td className="p-4 text-sm text-ink-600">
                    {u.subscriptionPlan ?? <span className="text-ink-300">—</span>}
                  </td>
                  <td className="p-4 text-xs text-ink-500">{relativeDate(u.createdAt)}</td>
                  <td className="p-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => deleteUser(u._id, u.name)}
                        className="p-2 hover:bg-rose-50 rounded text-ink-400 hover:text-rose-600 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
