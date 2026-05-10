"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";
import { Save, Loader2, Settings, Key, CreditCard, Tag, Megaphone, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import type { AppSettings } from "@/types";

const DEFAULT_SETTINGS: AppSettings = {
  markup: 500,
  jasaApiKey: "",
  pakasirApiKey: "",
  pakasirProject: "",
  maintenanceMode: false,
  announcementText: "",
  minDeposit: 10000,
  maxDeposit: 1000000,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "settings", "config"))
      .then((snap) => {
        if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() as AppSettings });
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "config"), settings, { merge: true });
      toast.success("Pengaturan berhasil disimpan!");
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-400" /></div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Pengaturan Sistem</h1>
        <p className="text-sm text-slate-500 mt-1">Konfigurasi KAMIL SHOP</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

        {/* Maintenance */}
        <div className="glass p-5 rounded-2xl border border-orange-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={16} className="text-orange-400" />
              <div>
                <div className="font-bold text-sm">Mode Maintenance</div>
                <div className="text-xs text-slate-500 mt-0.5">Nonaktifkan semua transaksi sementara</div>
              </div>
            </div>
            <button
              onClick={() => set("maintenanceMode", !settings.maintenanceMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings.maintenanceMode ? "bg-orange-500" : "bg-slate-700"}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.maintenanceMode ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>
          {settings.maintenanceMode && (
            <div className="mt-3 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400">
              ⚠️ Maintenance mode aktif — user tidak bisa order atau deposit
            </div>
          )}
        </div>

        {/* Announcement */}
        <div className="glass p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-300">
            <Megaphone size={15} className="text-indigo-400" />
            Pengumuman
          </div>
          <textarea
            value={settings.announcementText}
            onChange={(e) => set("announcementText", e.target.value)}
            placeholder="Teks pengumuman untuk user (kosongkan jika tidak ada)..."
            rows={3}
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 resize-none"
          />
        </div>

        {/* Pricing */}
        <div className="glass p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-300">
            <Tag size={15} className="text-emerald-400" />
            Harga & Deposit
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Markup Harga (Rp)</label>
              <input
                type="number"
                value={settings.markup}
                onChange={(e) => set("markup", Number(e.target.value))}
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/60"
              />
              <p className="text-xs text-slate-600 mt-1">Saat ini: {formatRupiah(settings.markup)}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Min Deposit (Rp)</label>
              <input
                type="number"
                value={settings.minDeposit}
                onChange={(e) => set("minDeposit", Number(e.target.value))}
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/60"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Maks Deposit (Rp)</label>
              <input
                type="number"
                value={settings.maxDeposit}
                onChange={(e) => set("maxDeposit", Number(e.target.value))}
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>
        </div>

        {/* Jasa OTP */}
        <div className="glass p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-300">
            <Key size={15} className="text-yellow-400" />
            Jasa OTP API
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">API Key</label>
            <input
              type="password"
              value={settings.jasaApiKey}
              onChange={(e) => set("jasaApiKey", e.target.value)}
              placeholder="Masukkan Jasa OTP API Key..."
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500/60 font-mono"
            />
          </div>
        </div>

        {/* Pakasir */}
        <div className="glass p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-300">
            <CreditCard size={15} className="text-blue-400" />
            Pakasir Payment
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">API Key</label>
              <input
                type="password"
                value={settings.pakasirApiKey}
                onChange={(e) => set("pakasirApiKey", e.target.value)}
                placeholder="Pakasir API Key..."
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/60 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Project ID</label>
              <input
                type="text"
                value={settings.pakasirProject}
                onChange={(e) => set("pakasirProject", e.target.value)}
                placeholder="Pakasir Project..."
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/60 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Note about env vars */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 text-xs text-slate-500 leading-relaxed">
          💡 <strong className="text-slate-400">Catatan:</strong> API key yang disimpan di sini digunakan sebagai fallback.
          Untuk keamanan maksimal, simpan juga di environment variables Vercel.
          Setting di sini akan override env vars untuk admin.
        </div>

        {/* Save Button */}
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </motion.div>
    </div>
  );
}
