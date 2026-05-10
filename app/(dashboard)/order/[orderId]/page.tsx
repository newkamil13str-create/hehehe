"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { formatRupiah, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/dashboard/StatusBadge";
import toast from "react-hot-toast";
import {
  Copy, RefreshCw, XCircle, ArrowLeft, CheckCircle,
  Clock, Loader2, Phone, Key,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Order } from "@/types";

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { authFetch, firebaseUser } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Real-time order from Firestore
  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(doc(db, "orders", orderId as string), (snap) => {
      if (snap.exists()) {
        setOrder(snap.data() as Order);
        setLoading(false);
      }
    });
    return unsub;
  }, [orderId]);

  // Countdown timer
  useEffect(() => {
    if (!order || order.status !== "waiting") return;
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const left = Math.max(0, 300 - elapsed);
      setTimeLeft(left);
      if (left === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [order?.status]);

  const checkOtp = useCallback(async () => {
    if (!orderId || checking) return;
    setChecking(true);
    try {
      const res = await authFetch("/api/otp/check", {
        method: "POST",
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.status === "received") {
        toast.success("OTP berhasil diterima! 🎉");
      }
    } catch {
      // silent fail on auto-check
    } finally {
      setChecking(false);
    }
  }, [orderId, authFetch, checking]);

  // Auto polling every 5s while waiting
  useEffect(() => {
    if (order?.status !== "waiting") {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }
    pollingRef.current = setInterval(checkOtp, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [order?.status, checkOtp]);

  async function cancelOrder() {
    if (!orderId) return;
    setCancelling(true);
    try {
      const res = await authFetch("/api/otp/cancel", {
        method: "POST",
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Order dibatalkan. Saldo telah dikembalikan.");
    } catch (err: any) {
      toast.error(err.message ?? "Gagal membatalkan order");
    } finally {
      setCancelling(false);
    }
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} disalin!`));
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <div className="text-slate-400 mb-4">Order tidak ditemukan</div>
        <Link href="/order" className="text-emerald-400 hover:underline">Buat order baru</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <Link href="/history" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Kembali ke Riwayat
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Status Card */}
        <div className={`glass p-6 rounded-2xl mb-4 border ${
          order.status === "received" ? "border-emerald-500/30" :
          order.status === "waiting" ? "border-yellow-500/30" :
          "border-slate-700/50"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-black">{order.namaLayanan}</h1>
              <p className="text-xs text-slate-500 mt-0.5">#{order.orderId}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Timer (only while waiting) */}
          {order.status === "waiting" && (
            <div className="flex items-center justify-center gap-2 mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <Clock size={15} className="text-yellow-400" />
              <span className="text-yellow-400 font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
              <span className="text-yellow-400/60 text-xs">sisa waktu</span>
            </div>
          )}

          {/* Number */}
          <div className="mb-4">
            <div className="text-xs text-slate-500 mb-1.5 flex items-center gap-1"><Phone size={11} /> Nomor Virtual</div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
              <span className="font-mono text-lg font-bold tracking-widest flex-1">{order.number}</span>
              <button
                onClick={() => copyText(order.number, "Nomor")}
                className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
              >
                <Copy size={15} />
              </button>
            </div>
          </div>

          {/* OTP */}
          {order.otp ? (
            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-1.5 flex items-center gap-1"><Key size={11} /> Kode OTP</div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                <span className="font-mono text-2xl font-black text-emerald-400 tracking-[0.3em] flex-1">{order.otp}</span>
                <button
                  onClick={() => copyText(order.otp!, "OTP")}
                  className="p-2 rounded-lg hover:bg-emerald-500/20 transition-colors text-emerald-400"
                >
                  <Copy size={15} />
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400/70">
                <CheckCircle size={11} />
                OTP berhasil diterima — segera gunakan sebelum kedaluwarsa
              </div>
            </div>
          ) : order.status === "waiting" ? (
            <div className="mb-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                Menunggu OTP... Auto-check setiap 5 detik
              </div>
            </div>
          ) : null}

          {/* Info row */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-slate-800/40">
              <div className="text-slate-500 mb-0.5">Harga</div>
              <div className="font-bold text-emerald-400">{formatRupiah(order.harga)}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/40">
              <div className="text-slate-500 mb-0.5">Negara</div>
              <div className="font-bold">{order.negara}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/40">
              <div className="text-slate-500 mb-0.5">Tanggal</div>
              <div className="font-bold">{order.createdAt ? formatDate(order.createdAt as any) : "-"}</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {order.status === "waiting" && (
          <div className="flex gap-3">
            <button
              onClick={cancelOrder}
              disabled={cancelling}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-red-400 border border-red-500/25 hover:bg-red-500/10 transition-all disabled:opacity-50"
            >
              {cancelling ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
              Batalkan
            </button>
            <button
              onClick={checkOtp}
              disabled={checking}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
            >
              {checking ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Cek OTP
            </button>
          </div>
        )}

        {(order.status === "received" || order.status === "cancelled") && (
          <Link
            href="/order"
            className="block text-center py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-90 transition-all"
          >
            + Order Baru
          </Link>
        )}
      </motion.div>
    </div>
  );
}
