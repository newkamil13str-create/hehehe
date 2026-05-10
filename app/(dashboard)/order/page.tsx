"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBalance } from "@/hooks/useBalance";
import { formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";
import { ChevronRight, Loader2, Search, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { JasaCountry, JasaService, JasaOperator } from "@/types";

type Step = "negara" | "layanan" | "operator" | "konfirmasi";

export default function OrderPage() {
  const router = useRouter();
  const { authFetch } = useAuth();
  const { balance, balanceFormatted } = useBalance();

  const [step, setStep] = useState<Step>("negara");
  const [countries, setCountries] = useState<JasaCountry[]>([]);
  const [services, setServices] = useState<JasaService[]>([]);
  const [operators, setOperators] = useState<JasaOperator[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<JasaCountry | null>(null);
  const [selectedService, setSelectedService] = useState<JasaService | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<JasaOperator | null>(null);
  const [markup, setMarkup] = useState(500);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [ordering, setOrdering] = useState(false);

  // Fetch countries
  useEffect(() => {
    setLoading(true);
    fetch("/api/otp/countries")
      .then((r) => r.json())
      .then((d) => setCountries(Array.isArray(d.countries) ? d.countries : []))
      .catch(() => toast.error("Gagal memuat daftar negara"))
      .finally(() => setLoading(false));
  }, []);

  // Fetch services when country selected
  useEffect(() => {
    if (!selectedCountry) return;
    setLoading(true);
    setServices([]);
    fetch(`/api/otp/services?negara=${selectedCountry.id}`)
      .then((r) => r.json())
      .then((d) => {
        setServices(Array.isArray(d.services) ? d.services : []);
        setMarkup(d.markup ?? 500);
      })
      .catch(() => toast.error("Gagal memuat layanan"))
      .finally(() => setLoading(false));
  }, [selectedCountry]);

  // Fetch operators when country selected
  useEffect(() => {
    if (!selectedCountry) return;
    fetch(`/api/otp/operators?negara=${selectedCountry.id}`)
      .then((r) => r.json())
      .then((d) => setOperators(Array.isArray(d.operators) ? d.operators : []));
  }, [selectedCountry]);

  const finalPrice = selectedService ? selectedService.harga + markup : 0;
  const hasBalance = balance >= finalPrice;

  const filtered = {
    countries: countries.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    services: services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
  };

  async function placeOrder() {
    if (!selectedService || !selectedCountry || !selectedOperator) return;
    setOrdering(true);
    try {
      const res = await authFetch("/api/otp/order", {
        method: "POST",
        body: JSON.stringify({
          layanan: selectedService.code,
          negara: selectedCountry.id,
          operator: selectedOperator.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Order gagal");
      toast.success("Order berhasil! Nomor sedang disiapkan...");
      router.push(`/order/${data.orderId}`);
    } catch (err: any) {
      toast.error(err.message ?? "Order gagal. Coba lagi.");
    } finally {
      setOrdering(false);
    }
  }

  const stepLabels: Record<Step, string> = {
    negara: "Pilih Negara",
    layanan: "Pilih Layanan",
    operator: "Pilih Operator",
    konfirmasi: "Konfirmasi",
  };
  const stepOrder: Step[] = ["negara", "layanan", "operator", "konfirmasi"];
  const currentStepIdx = stepOrder.indexOf(step);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Order OTP</h1>
        <p className="text-sm text-slate-500 mt-1">Pilih layanan dan dapatkan nomor virtual Anda</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {stepOrder.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                s === step
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : i < currentStepIdx
                  ? "bg-slate-800 text-slate-400 border border-slate-700"
                  : "text-slate-600"
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${i <= currentStepIdx ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-500"}`}>
                {i < currentStepIdx ? "✓" : i + 1}
              </span>
              {stepLabels[s]}
            </div>
            {i < stepOrder.length - 1 && <ChevronRight size={14} className="text-slate-700" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Negara */}
        {step === "negara" && (
          <motion.div key="negara" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="glass p-5 rounded-2xl">
              <h2 className="font-bold mb-4">Pilih Negara</h2>
              <div className="relative mb-4">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari negara..."
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-400" /></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                  {filtered.countries.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCountry(c); setSearch(""); setStep("layanan"); }}
                      className="p-3 rounded-xl text-left text-sm font-medium border border-slate-700/40 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 2: Layanan */}
        {step === "layanan" && (
          <motion.div key="layanan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="glass p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Pilih Layanan <span className="text-slate-500 text-sm font-normal">({selectedCountry?.name})</span></h2>
                <button onClick={() => { setSelectedCountry(null); setStep("negara"); }} className="text-xs text-slate-500 hover:text-slate-300">
                  Ganti negara
                </button>
              </div>
              <div className="relative mb-4">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari layanan..."
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-400" /></div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filtered.services.map((s) => (
                    <button
                      key={s.code}
                      onClick={() => { setSelectedService(s); setSearch(""); setStep("operator"); }}
                      disabled={s.stok === 0}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-700/40 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm font-bold text-emerald-400">
                          {s.name[0]}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-semibold">{s.name}</div>
                          <div className="text-xs text-slate-500">Stok: {s.stok}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400">{formatRupiah(s.harga + markup)}</div>
                        <div className="text-xs text-slate-600 line-through">{formatRupiah(s.harga)}</div>
                      </div>
                    </button>
                  ))}
                  {filtered.services.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">Layanan tidak ditemukan</div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 3: Operator */}
        {step === "operator" && (
          <motion.div key="operator" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="glass p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Pilih Operator</h2>
                <button onClick={() => setStep("layanan")} className="text-xs text-slate-500 hover:text-slate-300">
                  Ganti layanan
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {operators.length === 0 ? (
                  <button
                    onClick={() => { setSelectedOperator({ id: "any", name: "Semua Operator" }); setStep("konfirmasi"); }}
                    className="col-span-2 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold text-sm"
                  >
                    Semua Operator (Otomatis)
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => { setSelectedOperator({ id: "any", name: "Semua Operator" }); setStep("konfirmasi"); }}
                      className="p-4 rounded-xl border border-slate-700/40 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-sm font-semibold"
                    >
                      🔀 Semua Operator
                    </button>
                    {operators.map((op) => (
                      <button
                        key={op.id}
                        onClick={() => { setSelectedOperator(op); setStep("konfirmasi"); }}
                        className="p-4 rounded-xl border border-slate-700/40 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-sm font-semibold"
                      >
                        {op.name}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Konfirmasi */}
        {step === "konfirmasi" && selectedService && selectedCountry && selectedOperator && (
          <motion.div key="konfirmasi" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="glass p-6 rounded-2xl">
              <h2 className="font-bold mb-5">Konfirmasi Order</h2>
              <div className="space-y-3 mb-6">
                {[
                  { label: "Layanan", value: selectedService.name },
                  { label: "Negara", value: selectedCountry.name },
                  { label: "Operator", value: selectedOperator.name },
                  { label: "Harga API", value: formatRupiah(selectedService.harga) },
                  { label: "Markup", value: formatRupiah(markup) },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
                <div className="border-t border-slate-700/50 pt-3 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-black text-emerald-400">{formatRupiah(finalPrice)}</span>
                </div>
              </div>

              {/* Balance check */}
              <div className={`flex items-center gap-3 p-3.5 rounded-xl mb-5 text-sm ${hasBalance ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                <AlertCircle size={15} className={hasBalance ? "text-emerald-400" : "text-red-400"} />
                <div>
                  <span className={hasBalance ? "text-emerald-400" : "text-red-400"}>Saldo Anda: {balanceFormatted}</span>
                  {!hasBalance && (
                    <div className="text-red-400/70 text-xs">Saldo tidak cukup.{" "}
                      <a href="/deposit" className="underline">Top up dulu</a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("operator")}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-sm font-semibold text-slate-400 hover:bg-slate-800 transition-all"
                >
                  Kembali
                </button>
                <button
                  onClick={placeOrder}
                  disabled={!hasBalance || ordering}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {ordering && <Loader2 size={15} className="animate-spin" />}
                  {ordering ? "Memproses..." : "🛒 Beli Sekarang"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
