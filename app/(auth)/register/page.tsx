"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nama wajib diisi";
    if (!form.email) e.email = "Email wajib diisi";
    if (form.password.length < 8) e.password = "Password minimal 8 karakter";
    if (form.password !== form.confirm) e.confirm = "Password tidak cocok";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function createUserDoc(uid: string, displayName: string, email: string, photoURL: string) {
    await setDoc(doc(db, "users", uid), {
      uid,
      email,
      displayName,
      photoURL,
      balance: 0,
      role: "user",
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.name });
      await createUserDoc(cred.user.uid, form.name, form.email, "");
      toast.success("Akun berhasil dibuat! Selamat bergabung 🎉");
      router.push("/dashboard");
    } catch (err: any) {
      const msgs: Record<string, string> = {
        "auth/email-already-in-use": "Email sudah terdaftar. Silakan login.",
        "auth/invalid-email": "Format email tidak valid",
        "auth/weak-password": "Password terlalu lemah",
      };
      toast.error(msgs[err.code] ?? "Pendaftaran gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const existing = await getDoc(doc(db, "users", cred.user.uid));
      if (!existing.exists()) {
        await createUserDoc(
          cred.user.uid,
          cred.user.displayName ?? "User",
          cred.user.email ?? "",
          cred.user.photoURL ?? ""
        );
        toast.success("Akun berhasil dibuat dengan Google! 🎉");
      } else {
        toast.success("Berhasil masuk!");
      }
      router.push("/dashboard");
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error("Daftar dengan Google gagal.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setErrors((er) => ({ ...er, [key]: "" }));
    },
  });

  return (
    <div className="min-h-screen bg-[#080e1a] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(16,185,129,0.1)_0%,transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/30">
              K
            </div>
            <span className="text-xl font-black gradient-text">KAMIL SHOP</span>
          </Link>
          <h1 className="text-2xl font-black mt-6 mb-1">Buat Akun Gratis ✨</h1>
          <p className="text-sm text-slate-500">Mulai beli OTP dalam 30 detik</p>
        </div>

        <div className="glass p-7 rounded-2xl">
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-sm font-semibold hover:bg-slate-700/50 transition-all disabled:opacity-50 mb-5"
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Daftar dengan Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-700/50" />
            <span className="text-xs text-slate-600">atau isi form</span>
            <div className="flex-1 h-px bg-slate-700/50" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Nama Lengkap</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  {...field("name")}
                  placeholder="Nama Anda"
                  className={`w-full bg-slate-800/60 border rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${errors.name ? "border-red-500/60 focus:ring-red-500/30" : "border-slate-700/60 focus:border-emerald-500/60 focus:ring-emerald-500/30"}`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  {...field("email")}
                  placeholder="email@contoh.com"
                  className={`w-full bg-slate-800/60 border rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${errors.email ? "border-red-500/60 focus:ring-red-500/30" : "border-slate-700/60 focus:border-emerald-500/60 focus:ring-emerald-500/30"}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPw ? "text" : "password"}
                  {...field("password")}
                  placeholder="Min. 8 karakter"
                  className={`w-full bg-slate-800/60 border rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${errors.password ? "border-red-500/60 focus:ring-red-500/30" : "border-slate-700/60 focus:border-emerald-500/60 focus:ring-emerald-500/30"}`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
            </div>

            {/* Confirm */}
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Konfirmasi Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPw ? "text" : "password"}
                  {...field("confirm")}
                  placeholder="Ulangi password"
                  className={`w-full bg-slate-800/60 border rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${errors.confirm ? "border-red-500/60 focus:ring-red-500/30" : "border-slate-700/60 focus:border-emerald-500/60 focus:ring-emerald-500/30"}`}
                />
              </div>
              {errors.confirm && <p className="text-xs text-red-400 mt-1">{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Membuat akun..." : "Buat Akun Gratis"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-emerald-400 font-semibold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
