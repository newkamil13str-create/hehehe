"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useBalance } from "@/hooks/useBalance";
import { useActiveOrders } from "@/hooks/useOrders";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatRupiah, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { motion } from "framer-motion";
import {
  Wallet, ShoppingCart, CheckCircle, Clock, ArrowRight,
  Megaphone, Plus, RefreshCw,
} from "lucide-react";
import type { Order } from "@/types";

export default function DashboardPage() {
  const { userData, firebaseUser } = useAuth();
  const { balanceFormatted } = useBalance();
  const activeOrders = useActiveOrders();
  const [stats, setStats] = useState({ total: 0, success: 0, cancelled: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;

    async function fetchData() {
      try {
        const [allSnap, settingsSnap] = await Promise.all([
          getDocs(query(collection(db, "orders"), where("uid", "==", firebaseUser!.uid))),
          getDocs(collection(db, "settings")),
        ]);

        let total = 0, success = 0, cancelled = 0;
        allSnap.forEach((d) => {
          total++;
          const s = d.data().status;
          if (s === "received") success++;
          if (s === "cancelled") cancelled++;
        });
        setStats({ total, success, cancelled });

        settingsSnap.forEach((d) => {
          if (d.id === "config") setAnnouncement(d.data().announcementText ?? "");
        });

        const recSnap = await getDocs(
          query(collection(db, "orders"), where("uid", "==", firebaseUser!.uid), orderBy("createdAt", "desc"), limit(5))
        );
        setRecentOrders(recSnap.docs.map((d) => d.data() as Order));
      } finally {
        setLoadingStats(false);
      }
    }

    fetchData();
  }, [firebaseUser]);

  const displayName = userData?.displayName?.split(" ")[0] ?? "User";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-black">
          Halo, <span className="gradient-text">{displayName}!</span> 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">Selamat datang kembali di KAMIL SHOP</p>
      </motion.div>

      {/* Announcement */}
      {announcement && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-sm text-indigo-300"
        >
          <Megaphone size={16} className="flex-shrink-0 mt-0.5" />
          <span>{announcement}</span>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Balance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="col-span-2 glass p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
              <Wallet size={15} />
              Saldo
            </div>
            <Link href="/deposit" className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-lg hover:bg-emerald-500/25 transition-colors">
              <Plus size={12} /> Top Up
            </Link>
          </div>
          <div className="text-3xl font-black text-emerald-400">{balanceFormatted}</div>
        </motion.div>

        {[
          { label: "Total Order", value: stats.total, icon: ShoppingCart, color: "text-blue-400" },
          { label: "Berhasil", value: stats.success, icon: CheckCircle, color: "text-emerald-400" },
          { label: "Order Aktif", value: activeOrders.length, icon: Clock, color: "text-yellow-400" },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="glass p-5 rounded-2xl"
          >
            <div className={`flex items-center gap-2 text-sm font-medium mb-3 ${s.color}`}>
              <s.icon size={15} />
              <span className="text-slate-400">{s.label}</span>
            </div>
            <div className={`text-3xl font-black ${s.color}`}>
              {loadingStats ? <div className="w-12 h-8 shimmer rounded-lg" /> : s.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: "Beli OTP", href: "/order", emoji: "🛒", color: "from-emerald-500 to-emerald-600" },
          { label: "Top Up Saldo", href: "/deposit", emoji: "💰", color: "from-blue-500 to-blue-600" },
          { label: "Riwayat Order", href: "/history", emoji: "📋", color: "from-purple-500 to-purple-600" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${a.color} text-white font-semibold text-sm hover:opacity-90 hover:-translate-y-0.5 transition-all`}
          >
            <span className="text-xl">{a.emoji}</span>
            {a.label}
            <ArrowRight size={14} className="ml-auto" />
          </Link>
        ))}
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Order Aktif ({activeOrders.length})
            </h2>
          </div>
          <div className="space-y-2">
            {activeOrders.map((order) => (
              <Link
                key={order.orderId}
                href={`/order/${order.orderId}`}
                className="flex items-center justify-between glass p-4 rounded-xl hover:border-emerald-500/25 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-xs font-bold">
                    {order.namaLayanan[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{order.namaLayanan}</div>
                    <div className="text-xs text-slate-500 font-mono">{order.number}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.status} />
                  <ArrowRight size={14} className="text-slate-600" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm text-slate-300">Order Terbaru</h2>
          <Link href="/history" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
            Lihat semua <ArrowRight size={12} />
          </Link>
        </div>

        {recentOrders.length === 0 && !loadingStats ? (
          <div className="glass rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">📭</div>
            <div className="text-slate-400 text-sm font-medium mb-4">Belum ada order</div>
            <Link href="/order" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-colors">
              Beli OTP Pertamamu <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Layanan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden sm:table-cell">Nomor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Harga</th>
                </tr>
              </thead>
              <tbody>
                {loadingStats
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-800/30">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 shimmer rounded w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : recentOrders.map((o) => (
                      <tr key={o.orderId} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{o.namaLayanan}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs hidden sm:table-cell">{o.number}</td>
                        <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                        <td className="px-4 py-3 text-right text-emerald-400 font-semibold">{formatRupiah(o.harga)}</td>
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
