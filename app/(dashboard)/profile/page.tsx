"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBalance } from "@/hooks/useBalance";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { formatRupiah, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { User, Mail, Wallet, ShoppingCart, CheckCircle, Calendar, Loader2, LogOut, Edit2, Save, X } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { userData, firebaseUser, logout } = useAuth();
  const { balanceFormatted } = useBalance();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, success: 0, totalDeposit: 0 });

  useEffect(() => {
    if (!firebaseUser) return;
    Promise.all([
      getDocs(query(collection(db, "orders"), where("uid", "==", firebaseUser.uid))),
      getDocs(query(collection(db, "deposits"), where("uid", "==", firebaseUser.uid), where("status", "==", "paid"))),
    ]).then(([orders, deposits]) => {
      let success = 0;
      orders.forEach((d) => { if (d.data().status === "received") success++; });
      let totalDeposit = 0;
      deposits.forEach((d) => { totalDeposit += d.data().amount ?? 0; });
      setStats({ total: orders.size, success, totalDeposit });
    });
  }, [firebaseUser]);

  async function saveName() {
    if (!newName.trim() || !firebaseUser) return;
    setSaving(true);
    try {
      await updateProfile(firebaseUser, { displayName: newName.trim() });
      await updateDoc(doc(db, "users", firebaseUser.uid), { displayName: newName.trim() });
      toast.success("Nama berhasil diubah!");
      setEditing(false);
    } catch {
      toast.error("Gagal mengubah nama");
    } finally {
      setSaving(false);
    }
  }

  if (!userData) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-400" /></div>;
  }

  const avatarLetter = userData.displayName?.[0]?.toUpperCase() ?? "U";
  const joinDate = userData.createdAt ? formatDate(userData.createdAt as any) : "-";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Profil Saya</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola informasi akun Anda</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        {/* Avatar + Info */}
        <div className="glass p-6 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-emerald-500/20 flex-shrink-0">
            {avatarLetter}
          </div>
          <div className="flex-1 w-full text-center sm:text-left">
            {editing ? (
              <div className="flex gap-2 mb-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nama baru"
                  className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/60"
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditing(false); }}
                  autoFocus
                />
                <button onClick={saveName} disabled={saving} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                </button>
                <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-xl font-black">{userData.displayName}</h2>
                <button
                  onClick={() => { setNewName(userData.displayName ?? ""); setEditing(true); }}
                  className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-slate-500 hover:text-slate-300"
                >
                  <Edit2 size={13} />
                </button>
              </div>
            )}
            <p className="text-slate-500 text-sm flex items-center justify-center sm:justify-start gap-1.5">
              <Mail size={13} /> {userData.email}
            </p>
            <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${userData.role === "admin" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"}`}>
                {userData.role === "admin" ? "👑 Admin" : "👤 User"}
              </span>
              <span className="text-xs text-slate-600 flex items-center gap-1">
                <Calendar size={11} /> Bergabung {joinDate}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Wallet, label: "Saldo", value: balanceFormatted, color: "text-emerald-400" },
            { icon: ShoppingCart, label: "Total Order", value: stats.total.toString(), color: "text-blue-400" },
            { icon: CheckCircle, label: "Berhasil", value: stats.success.toString(), color: "text-emerald-400" },
            { icon: Wallet, label: "Total Deposit", value: formatRupiah(stats.totalDeposit), color: "text-purple-400" },
          ].map((s, i) => (
            <div key={i} className="glass p-4 rounded-xl text-center">
              <s.icon size={18} className={`${s.color} mx-auto mb-2`} />
              <div className={`text-base font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="glass p-5 rounded-2xl">
          <h3 className="font-bold text-sm mb-4 text-slate-300">Aksi Akun</h3>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all w-full sm:w-auto"
          >
            <LogOut size={15} />
            Keluar dari Akun
          </button>
        </div>
      </motion.div>
    </div>
  );
}
