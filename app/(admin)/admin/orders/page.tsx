"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection, query, orderBy, limit, getDocs, where, doc, updateDoc
} from "firebase/firestore";
import { formatRupiah, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/dashboard/StatusBadge";
import toast from "react-hot-toast";
import { Search, Loader2, XCircle, Filter } from "lucide-react";
import type { Order } from "@/types";
import { useAuth } from "@/hooks/useAuth";

const STATUSES = [
  { label: "Semua", value: "" },
  { label: "Menunggu", value: "waiting" },
  { label: "Berhasil", value: "received" },
  { label: "Dibatalkan", value: "cancelled" },
];

export default function AdminOrdersPage() {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const constraints: any[] = [orderBy("createdAt", "desc"), limit(100)];
    if (filter) constraints.push(where("status", "==", filter));
    getDocs(query(collection(db, "orders"), ...constraints))
      .then((snap) => setOrders(snap.docs.map((d) => d.data() as Order)))
      .finally(() => setLoading(false));
  }, [filter]);

  async function cancelOrder(order: Order) {
    if (!confirm(`Batalkan order ${order.orderId} dan refund ${formatRupiah(order.harga)}?`)) return;
    setCancelling(order.orderId);
    try {
      const res = await authFetch("/api/admin/cancel-order", {
        method: "POST",
        body: JSON.stringify({ orderId: order.orderId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOrders((prev) => prev.map((o) => o.orderId === order.orderId ? { ...o, status: "cancelled" } : o));
      toast.success("Order dibatalkan & saldo dikembalikan");
    } catch (err: any) {
      toast.error(err.message ?? "Gagal membatalkan order");
    } finally {
      setCancelling(null);
    }
  }

  const filtered = orders.filter(
    (o) =>
      o.namaLayanan?.toLowerCase().includes(search.toLowerCase()) ||
      o.number?.includes(search) ||
      o.uid?.includes(search) ||
      o.orderId?.includes(search)
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Kelola Order</h1>
        <p className="text-sm text-slate-500 mt-1">Semua order dari seluruh user</p>
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
            placeholder="Cari layanan, nomor, user ID..."
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60"
          />
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-400" size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">Tidak ada order ditemukan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  {["Order ID", "User", "Layanan", "Nomor", "OTP", "Status", "Harga", "Tanggal", "Aksi"].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.orderId} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{o.orderId}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{o.uid?.slice(0, 10)}...</td>
                    <td className="px-4 py-3.5 font-semibold whitespace-nowrap">{o.namaLayanan}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{o.number}</td>
                    <td className="px-4 py-3.5">
                      {o.otp
                        ? <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{o.otp}</span>
                        : <span className="text-slate-600 text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3.5 text-emerald-400 font-semibold whitespace-nowrap">{formatRupiah(o.harga)}</td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{o.createdAt ? formatDate(o.createdAt as any) : "-"}</td>
                    <td className="px-4 py-3.5">
                      {o.status === "waiting" && (
                        <button
                          onClick={() => cancelOrder(o)}
                          disabled={cancelling === o.orderId}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all disabled:opacity-50"
                        >
                          {cancelling === o.orderId
                            ? <Loader2 size={11} className="animate-spin" />
                            : <XCircle size={11} />
                          }
                          Batal
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
