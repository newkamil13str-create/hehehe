"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from "firebase/firestore";
import { formatRupiah, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Search, ChevronLeft, ChevronRight, Loader2, ExternalLink } from "lucide-react";
import type { Order } from "@/types";

const FILTERS = [
  { label: "Semua", value: "" },
  { label: "Menunggu", value: "waiting" },
  { label: "Berhasil", value: "received" },
  { label: "Dibatalkan", value: "cancelled" },
];

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const { firebaseUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [pages, setPages] = useState<QueryDocumentSnapshot[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  async function fetchOrders(page = 0) {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const constraints: any[] = [
        where("uid", "==", firebaseUser.uid),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE + 1),
      ];
      if (filter) constraints.push(where("status", "==", filter));
      if (page > 0 && pages[page - 1]) constraints.push(startAfter(pages[page - 1]));

      const snap = await getDocs(query(collection(db, "orders"), ...constraints));
      const docs = snap.docs;
      setHasMore(docs.length > PAGE_SIZE);
      const data = docs.slice(0, PAGE_SIZE).map((d) => d.data() as Order);
      setOrders(data);

      if (docs.length === PAGE_SIZE + 1) {
        setPages((prev) => {
          const next = [...prev];
          next[page] = docs[PAGE_SIZE - 1];
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCurrentPage(0);
    setPages([]);
    fetchOrders(0);
  }, [firebaseUser, filter]);

  const displayed = search
    ? orders.filter((o) => o.namaLayanan.toLowerCase().includes(search.toLowerCase()) || o.number.includes(search))
    : orders;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Riwayat Order</h1>
        <p className="text-sm text-slate-500 mt-1">Semua transaksi OTP Anda</p>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filter === f.value
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-800/60 text-slate-500 border border-slate-700/40 hover:text-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari layanan atau nomor..."
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2 text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-400" size={28} /></div>
        ) : displayed.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📭</div>
            <div className="text-slate-400 text-sm mb-4">Tidak ada order ditemukan</div>
            <Link href="/order" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-colors">
              Buat Order
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500">Layanan</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500">Nomor</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500">OTP</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500">Status</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500">Harga</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500">Tanggal</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((o) => (
                    <tr key={o.orderId} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                      <td className="px-5 py-3.5 font-semibold">{o.namaLayanan}</td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{o.number}</td>
                      <td className="px-5 py-3.5">
                        {o.otp ? (
                          <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">{o.otp}</span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                      <td className="px-5 py-3.5 text-right text-emerald-400 font-semibold">{formatRupiah(o.harga)}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{o.createdAt ? formatDate(o.createdAt as any) : "-"}</td>
                      <td className="px-5 py-3.5">
                        <Link href={`/order/${o.orderId}`} className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-slate-500 hover:text-white inline-flex">
                          <ExternalLink size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-800/40">
              {displayed.map((o) => (
                <Link key={o.orderId} href={`/order/${o.orderId}`} className="flex items-center justify-between p-4 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-sm font-bold text-emerald-400">
                      {o.namaLayanan[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{o.namaLayanan}</div>
                      <div className="text-xs text-slate-500 font-mono">{o.number}</div>
                      {o.otp && <div className="text-xs text-emerald-400 font-mono font-bold mt-0.5">{o.otp}</div>}
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={o.status} />
                    <div className="text-xs text-emerald-400 font-semibold mt-1">{formatRupiah(o.harga)}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800/40">
              <button
                onClick={() => { const p = currentPage - 1; setCurrentPage(p); fetchOrders(p); }}
                disabled={currentPage === 0 || loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-all disabled:opacity-30"
              >
                <ChevronLeft size={14} /> Sebelumnya
              </button>
              <span className="text-xs text-slate-500">Halaman {currentPage + 1}</span>
              <button
                onClick={() => { const p = currentPage + 1; setCurrentPage(p); fetchOrders(p); }}
                disabled={!hasMore || loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-all disabled:opacity-30"
              >
                Berikutnya <ChevronRight size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
