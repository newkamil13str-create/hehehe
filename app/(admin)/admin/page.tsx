"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, getDocs, where } from "firebase/firestore";
import { formatRupiah, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Users, ShoppingCart, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import type { Order, Deposit } from "@/types";
import { subDays, format, startOfDay } from "date-fns";
import { id } from "date-fns/locale";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, todayOrders: 0, todayRevenue: 0, totalRevenue: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<Deposit[]>([]);
  const [chartData, setChartData] = useState<{ day: string; orders: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = startOfDay(new Date());

    async function fetchStats() {
      const [usersSnap, ordersSnap, todayOrdersSnap, paidDepositsSnap, todayDepositsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(10))),
        getDocs(query(collection(db, "orders"), where("createdAt", ">=", today))),
        getDocs(query(collection(db, "deposits"), where("status", "==", "paid"))),
        getDocs(query(collection(db, "deposits"), where("status", "==", "paid"), where("createdAt", ">=", today))),
      ]);

      let totalRevenue = 0;
      paidDepositsSnap.forEach((d) => { totalRevenue += d.data().amount ?? 0; });
      let todayRevenue = 0;
      todayDepositsSnap.forEach((d) => { todayRevenue += d.data().amount ?? 0; });

      setStats({
        users: usersSnap.size,
        todayOrders: todayOrdersSnap.size,
        todayRevenue,
        totalRevenue,
      });
      setRecentOrders(ordersSnap.docs.map((d) => d.data() as Order));

      // 7-day chart
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        return { day: format(d, "EEE", { locale: id }), date: startOfDay(d) };
      });

      const chart = await Promise.all(
        days.map(async ({ day, date }) => {
          const nextDay = new Date(date.getTime() + 86400000);
          const snap = await getDocs(
            query(collection(db, "orders"), where("createdAt", ">=", date), where("createdAt", "<", nextDay))
          );
          return { day, orders: snap.size };
        })
      );
      setChartData(chart);
      setLoading(false);
    }

    fetchStats();

    // Real-time pending deposits
    const unsub = onSnapshot(
      query(collection(db, "deposits"), where("status", "==", "pending"), orderBy("createdAt", "desc"), limit(5)),
      (snap) => setPendingDeposits(snap.docs.map((d) => d.data() as Deposit))
    );
    return unsub;
  }, []);

  const statCards = [
    { label: "Total User", value: stats.users, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Order Hari Ini", value: stats.todayOrders, icon: ShoppingCart, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Revenue Hari Ini", value: formatRupiah(stats.todayRevenue), icon: TrendingUp, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
    { label: "Total Revenue", value: formatRupiah(stats.totalRevenue), icon: DollarSign, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview sistem KAMIL SHOP</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`glass p-5 rounded-2xl border ${s.bg}`}>
            <div className={`flex items-center gap-2 text-xs font-semibold mb-3 ${s.color}`}>
              <s.icon size={14} />
              <span className="text-slate-500">{s.label}</span>
            </div>
            {loading
              ? <div className="h-7 w-24 shimmer rounded-lg" />
              : <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            }
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Chart */}
        <div className="glass p-5 rounded-2xl">
          <h2 className="font-bold text-sm mb-4">Order 7 Hari Terakhir</h2>
          {loading ? (
            <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-400" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px" }}
                  labelStyle={{ color: "#94a3b8" }}
                  itemStyle={{ color: "#10b981" }}
                />
                <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} name="Order" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pending deposits */}
        <div className="glass p-5 rounded-2xl">
          <h2 className="font-bold text-sm mb-4">Deposit Menunggu ({pendingDeposits.length})</h2>
          {pendingDeposits.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">Tidak ada deposit pending</div>
          ) : (
            <div className="space-y-2">
              {pendingDeposits.map((d) => (
                <div key={d.depositId} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/40">
                  <div>
                    <div className="text-sm font-semibold">{formatRupiah(d.amount)}</div>
                    <div className="text-xs text-slate-500">{d.uid.slice(0, 12)}...</div>
                  </div>
                  <div className="text-xs text-yellow-400 font-semibold">Menunggu</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/60">
          <h2 className="font-bold text-sm">Order Terbaru (Real-time)</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-400" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Layanan</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Nomor</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500">Harga</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.orderId} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                    <td className="px-5 py-3 text-xs text-slate-500 font-mono">{o.uid?.slice(0, 10)}...</td>
                    <td className="px-5 py-3 font-semibold">{o.namaLayanan}</td>
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs">{o.number}</td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3 text-right text-emerald-400 font-semibold">{formatRupiah(o.harga)}</td>
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
