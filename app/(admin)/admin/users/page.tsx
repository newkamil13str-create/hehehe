"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, doc, updateDoc } from "firebase/firestore";
import { formatRupiah, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { Search, Loader2, Edit2, Save, X, Shield, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { User as UserType } from "@/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState("");
  const [editRole, setEditRole] = useState<"user" | "admin">("user");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")))
      .then((snap) => setUsers(snap.docs.map((d) => d.data() as UserType)))
      .finally(() => setLoading(false));
  }, []);

  function startEdit(u: UserType) {
    setEditingUid(u.uid);
    setEditBalance(u.balance.toString());
    setEditRole(u.role);
  }

  async function saveEdit(uid: string) {
    const bal = parseInt(editBalance);
    if (isNaN(bal) || bal < 0) { toast.error("Saldo tidak valid"); return; }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", uid), { balance: bal, role: editRole });
      setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, balance: bal, role: editRole } : u));
      toast.success("User berhasil diperbarui");
      setEditingUid(null);
    } catch {
      toast.error("Gagal memperbarui user");
    } finally {
      setSaving(false);
    }
  }

  const filtered = users.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Kelola User</h1>
        <p className="text-sm text-slate-500 mt-1">{users.length} user terdaftar</p>
      </div>

      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau email..."
          className="w-full max-w-sm bg-slate-800/60 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60"
        />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-400" size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  {["User", "Email", "Saldo", "Role", "Bergabung", "Aksi"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.uid} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.displayName?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <span className="font-semibold">{u.displayName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{u.email}</td>
                    <td className="px-5 py-3.5">
                      {editingUid === u.uid ? (
                        <input
                          type="number"
                          value={editBalance}
                          onChange={(e) => setEditBalance(e.target.value)}
                          className="w-28 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                        />
                      ) : (
                        <span className="text-emerald-400 font-semibold">{formatRupiah(u.balance)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {editingUid === u.uid ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as "user" | "admin")}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs focus:outline-none"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          u.role === "admin"
                            ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/25"
                            : "bg-slate-700/50 text-slate-400 border-slate-600/30"
                        }`}>
                          {u.role === "admin" ? "👑 Admin" : "👤 User"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {u.createdAt ? formatDate(u.createdAt as any) : "-"}
                    </td>
                    <td className="px-5 py-3.5">
                      {editingUid === u.uid ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => saveEdit(u.uid)}
                            disabled={saving}
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                          </button>
                          <button
                            onClick={() => setEditingUid(null)}
                            className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(u)}
                          className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-slate-500 hover:text-white"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
