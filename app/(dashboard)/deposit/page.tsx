"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs, onSnapshot, doc } from "firebase/firestore";
import { formatRupiah, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Copy, Clock, CheckCircle, AlertCircle, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Deposit } from "@/types";

const AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

type DepositState = "form" | "qr" | "success";

export default function DepositPage() {
  const { authFetch, firebaseUser } = useAuth();
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<DepositState>("form");
  const [depositData, setDepositData] = useState<{
    depositId: string; paymentNumber: string; totalPayment: number; expiredAt: string;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Deposit[]>([]);
  const [histLoading, setHistLoading] = useState(true);
  const [settings, setSettings] = useState({ min: 10000, max: 1000000 });
  const pollingRef = useRef<() => void>();

  // Load settings + history
  useEffect(() => {
    if (!firebaseUser) return;

    // Settings
    getDocs(collection(db, "settings")).then((snap) => {
      snap.forEach((d) => {
        if (d.id === "config") {
          setSettings({ min: d.data().minDeposit ?? 10000, max: d.data().maxDeposit ?? 1000000 });
        }
      });
    });

    // History
    getDocs(
      query(collection(db, "deposits"), where("uid", "==", firebaseUser.uid), orderBy("createdAt", "desc"), limit(10))
    ).then((snap) => {
      setHistory(snap.docs.map((d) => d.data() as Deposit));
      setHistLoading(false);
    });
  }, [firebaseUser, state]);

  // Countdown
  useEffect(() => {
    if (!depositData) return;
    const exp = new Date(depositData.expiredAt).getTime();
    const tick = () => setTimeLeft(Math.max(0, Math.floor((exp - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [depositData]);

  // Real-time listen for payment
  useEffect(() => {
    if (!depositData?.depositId || state !== "qr") return;
    const unsub = onSnapshot(doc(db, "deposits", depositData.depositId), (snap) => {
      if (snap.data()?.status === "paid") {
        setState("success");
        toast.success("Pembayaran berhasil! Saldo telah ditambahkan 🎉");
      }
    });
    pollingRef.current = unsub;
    return unsub;
  }, [depositData?.depositId, state]);

  async function createDeposit() {
    const num = parseInt(amount.replace(/\D/g, ""));
    if (isNaN(num) || num < settings.min || num > settings.max) {
      toast.error(`Nominal antara ${formatRupiah(settings.min)} - ${formatRupiah(settings.max)}`);
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch("/api/payment/create", {
        method: "POST",
        body: JSON.stringify({ amount: num }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDepositData(data);
      setState("qr");
    } catch (err: any) {
      toast.error(err.message ?? "Gagal membuat pembayaran");
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const statusColor: Record<string, string> = {
    pending: "text-yellow-400",
    paid: "text-emerald-400",
    expired: "text-slate-500",
  };
  const statusLabel: Record<string, string> = { pending: "Menunggu", paid: "Dibayar", expired: "Kedaluwarsa" };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Deposit Saldo</h1>
        <p className="text-sm text-slate-500 mt-1">Top up saldo untuk membeli OTP</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Form / QR / Success */}
        <div>
          <AnimatePresence mode="wait">
            {/* FORM */}
            {state === "form" && (
              <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="glass p-6 rounded-2xl">
                  <div className="flex items-center gap-2 mb-5 text-sm font-semibold text-slate-300">
                    <Wallet size={16} className="text-emerald-400" />
                    Pilih Nominal
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {AMOUNTS.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAmount(a.toString())}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          amount === a.toString()
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-slate-800/50 text-slate-400 border-slate-700/40 hover:border-slate-600"
                        }`}
                      >
                        {formatRupiah(a)}
                      </button>
                    ))}
                  </div>

                  <div className="mb-5">
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Atau masukkan nominal</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">Rp</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        min={settings.min}
                        max={settings.max}
                        className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">Min: {formatRupiah(settings.min)} | Maks: {formatRupiah(settings.max)}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/30 mb-5 text-sm">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-slate-500">Metode</span>
                      <span className="font-semibold">QRIS</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>GoPay • OVO • Dana • ShopeePay • BCA • Mandiri</span>
                    </div>
                  </div>

                  <button
                    onClick={createDeposit}
                    disabled={loading || !amount}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 size={15} className="animate-spin" />}
                    {loading ? "Membuat pembayaran..." : "Buat Pembayaran QRIS"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* QR CODE */}
            {state === "qr" && depositData && (
              <motion.div key="qr" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="glass p-6 rounded-2xl text-center">
                  <div className="text-sm font-semibold text-slate-400 mb-2">Scan QRIS untuk membayar</div>
                  <div className="text-2xl font-black text-emerald-400 mb-4">{formatRupiah(depositData.totalPayment)}</div>

                  {/* QR */}
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-white rounded-2xl">
                      <QRCodeSVG
                        value={depositData.paymentNumber}
                        size={200}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                  </div>

                  {/* Timer */}
                  <div className={`flex items-center justify-center gap-2 mb-4 text-sm ${timeLeft < 60 ? "text-red-400" : "text-yellow-400"}`}>
                    <Clock size={14} />
                    <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                    <span className="text-slate-500">sisa waktu</span>
                  </div>

                  {/* Copy QRIS string */}
                  <button
                    onClick={() => { navigator.clipboard.writeText(depositData.paymentNumber); toast.success("QRIS disalin!"); }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-slate-400 border border-slate-700/50 hover:bg-slate-800 transition-all mb-4"
                  >
                    <Copy size={13} /> Salin Kode QRIS
                  </button>

                  <div className="text-xs text-slate-500 leading-relaxed">
                    Bayar via GoPay, OVO, Dana, ShopeePay, BCA, Mandiri, atau e-wallet lainnya.
                    Saldo otomatis masuk setelah pembayaran berhasil.
                  </div>

                  <button onClick={() => { setState("form"); setDepositData(null); }} className="mt-4 text-xs text-slate-600 hover:text-slate-400 transition-colors">
                    Batal
                  </button>
                </div>
              </motion.div>
            )}

            {/* SUCCESS */}
            {state === "success" && depositData && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="glass p-8 rounded-2xl text-center border border-emerald-500/30">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-black text-emerald-400 mb-2">Pembayaran Berhasil!</h2>
                  <p className="text-slate-400 text-sm mb-4">
                    {formatRupiah(depositData.totalPayment)} telah berhasil ditambahkan ke saldo Anda.
                  </p>
                  <button
                    onClick={() => { setState("form"); setDepositData(null); setAmount(""); }}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
                  >
                    Deposit Lagi
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: History */}
        <div>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800/60">
              <h2 className="font-bold text-sm">Riwayat Deposit</h2>
            </div>
            {histLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-400" size={20} /></div>
            ) : history.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm">Belum ada riwayat deposit</div>
            ) : (
              <div className="divide-y divide-slate-800/40">
                {history.map((d) => (
                  <div key={d.depositId} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{formatRupiah(d.amount)}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{d.createdAt ? formatDate(d.createdAt as any) : "-"}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold ${statusColor[d.status]}`}>{statusLabel[d.status]}</div>
                      <div className="text-xs text-slate-600 uppercase mt-0.5">{d.paymentMethod}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
