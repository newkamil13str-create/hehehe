"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBalance } from "@/hooks/useBalance";
import {
  LayoutDashboard, ShoppingCart, History, Wallet, User,
  Settings, LogOut, Menu, X, Shield,
} from "lucide-react";
import { useState } from "react";
import { formatRupiah } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/order", icon: ShoppingCart, label: "Order OTP" },
  { href: "/history", icon: History, label: "Riwayat" },
  { href: "/deposit", icon: Wallet, label: "Deposit" },
  { href: "/profile", icon: User, label: "Profil" },
];

export default function DashboardNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userData, logout, isAdmin } = useAuth();
  const { balanceFormatted } = useBalance();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080e1a] flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#0d1526] border-r border-slate-800/60 fixed top-0 left-0 h-full z-30">
        {/* Logo */}
        <div className="p-5 border-b border-slate-800/60">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-emerald-500/20">
              K
            </div>
            <span className="font-black gradient-text text-base">KAMIL SHOP</span>
          </Link>
        </div>

        {/* Balance */}
        <div className="mx-4 mt-4 p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
          <div className="text-xs text-slate-500 mb-1">Saldo Anda</div>
          <div className="text-lg font-black text-emerald-400">{balanceFormatted}</div>
          <Link href="/deposit" className="mt-2 block text-center text-xs font-bold text-white bg-emerald-600/80 hover:bg-emerald-600 rounded-lg py-1.5 transition-colors">
            + Top Up
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-2 ${
                pathname.startsWith("/admin")
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              <Shield size={17} />
              Admin Panel
            </Link>
          )}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-slate-800/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userData?.displayName?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-300 truncate">{userData?.displayName}</div>
              <div className="text-[10px] text-slate-600 truncate">{userData?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={14} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-[#0d1526]/95 backdrop-blur-xl border-b border-slate-800/60 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-sm">
            K
          </div>
          <span className="font-black gradient-text text-sm">KAMIL SHOP</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-emerald-400">{balanceFormatted}</span>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-400">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 pt-14" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-64 h-full bg-[#0d1526] border-r border-slate-800 p-4 space-y-1 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    active ? "bg-emerald-500/15 text-emerald-400" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                  }`}
                >
                  <item.icon size={17} />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-indigo-400">
                <Shield size={17} />
                Admin Panel
              </Link>
            )}
            <button onClick={logout} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 w-full mt-4">
              <LogOut size={17} />
              Keluar
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
