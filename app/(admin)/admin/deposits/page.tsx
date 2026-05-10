"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection, query, orderBy, limit, getDocs, where, doc, updateDoc, runTransaction
} from "firebase/firestore";
import { formatRupiah, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { Search, Loader2, CheckCircle } from "lucide-react";
import type { Deposit } from "@/types";

const STATUSES = [
  { label: "Semua", value: "" },
  { label: "Menunggu", value: "pending" },
  { label: "Dibayar", value: "paid" },
  { label: "Expired", value: "expired" },
];

const statusStyle: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  expired: "bg-slate-700/50 text-slate-500 border-slate-600/30",
};
const statusLabel: Record<string, string> = { pending: "Menunggu", paid: "Dibayar", expired: "Expired" };

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const constraints: any[] = [orderBy("createdAt", "desc"), limit(100)];
    if (filter) constraints.push(where("status", "==", filter));
    getDocs(query(collection(db, "deposits"), ...constraints))
      .then((snap) => setDeposits(snap.docs.map((d) => d.data() as Deposit)))
      .finally(() => setLoading(false));
  }, [filter]);

  async function approveDeposit(deposit: Deposit) {
    if (!confirm(`Approve deposit ${formatRupiah(deposit.amount)} untuk user ${deposit.uid.slice(0, 12)}...?`)) return;
    setApproving(deposit.depositId);
    try {
      // client-side admin approve — calls server API
      const res = await fetch("/api/admin/approve-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId: deposit.depositId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setDeposits((prev) => prev.map((d) => d.depositId === deposit.depositId ? { ...d, status: "paid" } : d));
      toast.success("Deposit approved! Saldo user telah ditambahkan.");
    } catch (err: any) {
      toast.error(err.message ?? "Gagal approve deposit");
    } finally {
      setApproving(null);
    }
  }

  const filtered = deposits.filter(
    (d) =>
      d.uid?.includes(search) ||
      d.depositId?.includes(search) ||
      d.pakasirOrderId?.includes(search)
  );

  const totalPaid = deposits.filter((d) => d.status === "paid").reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Kelola Deposit</h1>
          <p className="text-sm text-slate-500 mt-1">Semua transaksi deposit</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Total Revenue</div>
          <div className="text-xl font-black text-emerald-400">{formatRupiah(totalPaid)}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filter === s.value
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                  : "bg-slate-800/60 text-slate-500 border border-slate-700/40 hover:text-slate-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari deposit ID atau user ID..."
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60"
          />
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-400" size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">Tidak ada deposit ditemukan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  {["Deposit ID", "User", "Nominal", "Total Bayar", "Metode", "Status", "Tanggal", "Aksi"].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.depositId} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{d.depositId?.slice(0, 20)}...</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{d.uid?.slice(0, 12)}...</td>
                    <td className="px-4 py-3.5 font-semibold text-emerald-400">{formatRupiah(d.amount)}</td>
                    <td className="px-4 py-3.5 text-slate-300">{formatRupiah(d.totalPayment)}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 uppercase">{d.paymentMethod}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle[d.status]}`}>
                        {statusLabel[d.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{d.createdAt ? formatDate(d.createdAt as any) : "-"}</td>
                    <td className="px-4 py-3.5">
                      {d.status === "pending" && (
                        <button
                          onClick={() => approveDeposit(d)}
                          disabled={approving === d.depositId}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/10 transition-all disabled:opacity-50 whitespace-nowrap"
                        >
                          {approving === d.depositId
                            ? <Loader2 size={11} className="animate-spin" />
                            : <CheckCircle size={11} />
                          }
                          Approve
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
