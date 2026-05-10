"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Shield, Globe, HeadphonesIcon, ArrowRight, CheckCircle,
  ChevronDown, Star, Menu, X, Copy, MessageCircle,
} from "lucide-react";

const SERVICES = [
  { name: "WhatsApp", emoji: "💬", color: "#25D366", bg: "rgba(37,211,102,0.08)", price: "ab Rp 1.500", hot: true },
  { name: "Telegram", emoji: "✈️", color: "#26A5E4", bg: "rgba(38,165,228,0.08)", price: "ab Rp 1.800", hot: true },
  { name: "Facebook", emoji: "👤", color: "#1877F2", bg: "rgba(24,119,242,0.08)", price: "ab Rp 2.000", hot: false },
  { name: "Instagram", emoji: "📸", color: "#E1306C", bg: "rgba(225,48,108,0.08)", price: "ab Rp 2.500", hot: false },
  { name: "TikTok", emoji: "🎵", color: "#FF0050", bg: "rgba(255,0,80,0.08)", price: "ab Rp 2.200", hot: true },
  { name: "Gmail", emoji: "📧", color: "#EA4335", bg: "rgba(234,67,53,0.08)", price: "ab Rp 3.000", hot: false },
  { name: "Twitter/X", emoji: "🐦", color: "#1DA1F2", bg: "rgba(29,161,242,0.08)", price: "ab Rp 2.800", hot: false },
  { name: "Shopee", emoji: "🛍️", color: "#EE4D2D", bg: "rgba(238,77,45,0.08)", price: "ab Rp 1.700", hot: false },
];

const FAQS = [
  { q: "Apa itu OTP Virtual Number?", a: "Nomor telepon sementara yang digunakan untuk menerima kode verifikasi dari berbagai layanan tanpa menggunakan nomor pribadi Anda." },
  { q: "Berapa lama nomor aktif setelah dibeli?", a: "Nomor aktif selama 5–20 menit tergantung layanan. OTP otomatis masuk ke dashboard Anda dalam waktu tersebut." },
  { q: "Bagaimana cara deposit saldo?", a: "Deposit via QRIS yang mendukung semua e-wallet (GoPay, OVO, Dana, ShopeePay) dan mobile banking. Saldo masuk otomatis setelah pembayaran berhasil." },
  { q: "Apakah saldo bisa dikembalikan jika order gagal?", a: "Ya! Jika OTP tidak diterima, Anda bisa batalkan order dan saldo otomatis dikembalikan penuh ke akun." },
  { q: "Layanan apa saja yang tersedia?", a: "Ratusan layanan dari berbagai negara — WhatsApp, Facebook, Telegram, Instagram, TikTok, Gmail, dan masih banyak lagi." },
  { q: "Apakah KAMIL SHOP aman digunakan?", a: "Sangat aman. Semua transaksi dienkripsi, API key hanya diakses server-side, dan saldo hanya bisa diubah via atomic transaction." },
];

const TESTIMONIALS = [
  { name: "Ahmad Fauzi", role: "Online Seller", avatar: "AF", color: "#10b981", text: "Udah pake dari 6 bulan lalu, gak pernah kecewa. OTP masuk dalam hitungan detik, harga paling murah!", stars: 5 },
  { name: "Siti Rahayu", role: "Digital Marketer", avatar: "SR", color: "#6366f1", text: "Top banget! Butuh banyak akun untuk kerja, tinggal order di sini langsung jadi. CS responsif!", stars: 5 },
  { name: "Budi Santoso", role: "Freelancer", avatar: "BS", color: "#f59e0b", text: "Simpel, cepat, murah. Deposit QRIS langsung masuk. 10/10 recommended buat teman-teman!", stars: 5 },
];

function AnimatedCounter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const step = end / 60;
          let cur = 0;
          const timer = setInterval(() => {
            cur += step;
            if (cur >= end) { setVal(end); clearInterval(timer); }
            else setVal(Math.floor(cur));
          }, 24);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);

  return <span ref={ref}>{val.toLocaleString("id-ID")}{suffix}</span>;
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const navLinks = [
    { label: "Beranda", id: "hero" },
    { label: "Layanan", id: "services" },
    { label: "Cara Order", id: "how" },
    { label: "FAQ", id: "faq" },
  ];

  return (
    <div className="min-h-screen bg-[#080e1a] text-slate-100 overflow-x-hidden">
      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 h-16 flex items-center justify-between px-6 transition-all duration-300 ${scrolled ? "bg-[#080e1a]/90 backdrop-blur-xl border-b border-emerald-500/10" : ""}`}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/30">
            K
          </div>
          <span className="text-lg font-black gradient-text tracking-tight">KAMIL SHOP</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex gap-8">
          {navLinks.map((l) => (
            <li key={l.id}>
              <button onClick={() => scrollTo(l.id)} className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors">
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-semibold text-emerald-400 border border-emerald-500/40 rounded-lg hover:bg-emerald-500/10 transition-all">
            Masuk
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg hover:shadow-lg hover:shadow-emerald-500/30 transition-all">
            Daftar Gratis
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-slate-400" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 inset-x-0 z-40 bg-[#0f172a] border-b border-slate-700/50 px-6 py-4 flex flex-col gap-4"
          >
            {navLinks.map((l) => (
              <button key={l.id} onClick={() => scrollTo(l.id)} className="text-left text-slate-300 font-medium py-2">
                {l.label}
              </button>
            ))}
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="flex-1 text-center py-2.5 text-sm font-semibold text-emerald-400 border border-emerald-500/40 rounded-lg">
                Masuk
              </Link>
              <Link href="/register" className="flex-1 text-center py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg">
                Daftar
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 pb-16">
        {/* bg effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.13)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,rgba(99,102,241,0.07)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-semibold mb-8">
            <Zap size={14} /> Platform OTP Reseller Terpercaya #1 di Indonesia
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-[1.03] tracking-[-3px] mb-6">
            Nomor Virtual OTP
            <br />
            <span className="gradient-text">Cepat & Terpercaya</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Dapatkan nomor virtual untuk verifikasi WhatsApp, Facebook, Telegram, dan 200+ layanan lainnya.
            Proses instan, harga mulai{" "}
            <span className="text-emerald-400 font-bold">Rp 1.500</span>.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Link
              href="/register"
              className="flex items-center gap-2 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:shadow-xl hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
            >
              🚀 Mulai Order Sekarang <ArrowRight size={18} />
            </Link>
            <button
              onClick={() => scrollTo("how")}
              className="flex items-center gap-2 px-8 py-4 text-base font-bold text-slate-300 bg-slate-800/60 border border-slate-700/50 rounded-xl hover:bg-slate-700/50 transition-all hover:-translate-y-0.5"
            >
              📖 Cara Kerja
            </button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-10 sm:gap-16">
            {[
              { end: 50000, suffix: "+", label: "Order Berhasil" },
              { end: 15000, suffix: "+", label: "Pengguna Aktif" },
              { end: 200, suffix: "+", label: "Layanan" },
              { end: 99, suffix: "%", label: "Uptime" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-black gradient-text">
                  <AnimatedCounter end={s.end} suffix={s.suffix} />
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: <Zap className="text-emerald-400" size={22} />, title: "Proses Instan", desc: "OTP diterima dalam hitungan detik tanpa menunggu lama." },
            { icon: <Globe className="text-blue-400" size={22} />, title: "200+ Layanan", desc: "Ratusan layanan dari berbagai negara tersedia 24 jam." },
            { icon: <Shield className="text-purple-400" size={22} />, title: "Aman & Terpercaya", desc: "Enkripsi end-to-end. API key aman di server-side." },
            { icon: <HeadphonesIcon className="text-yellow-400" size={22} />, title: "Support 24/7", desc: "Tim support siap membantu kapanpun Anda butuhkan." },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-2xl hover:border-emerald-500/30 transition-all hover:-translate-y-1 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <div className="font-bold text-base mb-2">{f.title}</div>
              <div className="text-sm text-slate-500 leading-relaxed">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-semibold mb-4">
            🔥 Layanan Populer
          </div>
          <h2 className="text-4xl font-black tracking-tight mb-3">
            Tersedia <span className="gradient-text">200+ Layanan</span>
          </h2>
          <p className="text-slate-500">Dari medsos sampai marketplace — semua ada dengan harga terbaik</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {SERVICES.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="relative p-5 rounded-2xl border border-slate-700/40 text-center cursor-pointer group hover:-translate-y-1 transition-all hover:border-emerald-500/30"
              style={{ background: s.bg }}
            >
              {s.hot && (
                <span className="absolute top-2.5 right-2.5 text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-2 py-0.5 rounded-full">
                  HOT
                </span>
              )}
              <div className="text-4xl mb-3">{s.emoji}</div>
              <div className="font-bold text-sm mb-1">{s.name}</div>
              <div className="text-xs font-semibold" style={{ color: s.color }}>{s.price}</div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
          >
            Lihat Semua Layanan <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="bg-slate-900/40 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-semibold mb-4">
              📋 Panduan
            </div>
            <h2 className="text-4xl font-black tracking-tight mb-3">
              Order dalam <span className="gradient-text">4 Langkah</span>
            </h2>
            <p className="text-slate-500">Tidak perlu skill teknis — siapapun bisa menggunakannya</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: 1, icon: "📝", title: "Daftar & Isi Saldo", desc: "Buat akun gratis dalam 30 detik. Top up via QRIS menggunakan GoPay, OVO, Dana, atau mobile banking." },
              { step: 2, icon: "🔍", title: "Pilih Layanan", desc: "Browse ratusan layanan. Pilih negara, layanan yang dibutuhkan, dan operator." },
              { step: 3, icon: "📱", title: "Dapatkan Nomor", desc: "Sistem memberikan nomor virtual aktif. Gunakan untuk mendaftar di layanan tujuan." },
              { step: 4, icon: "✅", title: "Terima OTP", desc: "OTP muncul otomatis di dashboard. Copy dan gunakan untuk verifikasi akun Anda." },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-7 rounded-2xl text-center"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-xl font-black flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25 animate-pulse-green">
                  {s.step}
                </div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <div className="font-bold mb-2">{s.title}</div>
                <div className="text-sm text-slate-500 leading-relaxed">{s.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black tracking-tight mb-3">
            Dipercaya <span className="gradient-text">15.000+ Pengguna</span>
          </h2>
          <p className="text-slate-500">Dengarkan dari pengguna nyata kami</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-7 rounded-2xl"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: t.color }}>
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-slate-900/40 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black tracking-tight mb-3">
              Pertanyaan <span className="gradient-text">yang Sering Ditanya</span>
            </h2>
            <p className="text-slate-500">Tidak menemukan jawaban? Email kami di admin@kamilshop.my.id</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div
                key={i}
                className={`glass rounded-2xl overflow-hidden transition-all ${activeFaq === i ? "border-emerald-500/30" : ""}`}
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-sm"
                >
                  <span>{f.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-emerald-400 flex-shrink-0 ml-4 transition-transform ${activeFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">{f.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative text-center p-12 rounded-3xl overflow-hidden border border-emerald-500/20"
          style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(99,102,241,0.05))" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(16,185,129,0.05)_0%,transparent_70%)]" />
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
              Mulai Sekarang. <span className="gradient-text">Gratis!</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Bergabung dengan 15.000+ pengguna aktif. Tidak ada biaya pendaftaran.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/register"
                className="flex items-center gap-2 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:shadow-xl hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
              >
                🚀 Daftar Sekarang — Gratis
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 text-base font-bold text-slate-300 bg-slate-800/60 border border-slate-700/50 rounded-xl hover:bg-slate-700/50 transition-all"
              >
                Sudah punya akun →
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/60 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div>
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-lg">
                  K
                </div>
                <span className="text-lg font-black gradient-text">KAMIL SHOP</span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                Platform reseller OTP terpercaya di Indonesia. Beli nomor virtual untuk verifikasi 200+ layanan.
              </p>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Navigasi</div>
              <div className="space-y-2">
                {["Beranda", "Layanan", "Cara Order", "FAQ", "Masuk", "Daftar"].map((l, i) => (
                  <div key={i}>
                    <Link
                      href={l === "Masuk" ? "/login" : l === "Daftar" ? "/register" : "#"}
                      className="text-sm text-slate-500 hover:text-emerald-400 transition-colors"
                    >
                      {l}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Kontak</div>
              <div className="space-y-2 text-sm text-slate-500">
                <div>📧 admin@kamilshop.my.id</div>
                <div>🌐 kamilshop.my.id</div>
              </div>
              <div className="mt-5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pembayaran</div>
                <div className="text-sm text-slate-500">✅ QRIS (GoPay, OVO, Dana, ShopeePay, dll)</div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-600">
            <span>© 2025 KAMIL SHOP. All rights reserved.</span>
            <span>Made with ❤️ in Indonesia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
