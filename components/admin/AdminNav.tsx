"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Users, ShoppingCart, Wallet, Settings,
  LogOut, ChevronLeft, Shield,
} from "lucide-react";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Kelola User" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Kelola Order" },
  { href: "/admin/deposits", icon: Wallet, label: "Kelola Deposit" },
  { href: "/admin/settings", icon: Settings, label: "Pengaturan" },
];

export default function AdminNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#080e1a] flex">
      <aside className="hidden lg:flex flex-col w-56 bg-[#0d1526] border-r border-indigo-500/10 fixed top-0 left-0 h-full z-30">
        <div className="p-5 border-b border-slate-800/60">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-indigo-400" />
            <span className="text-sm font-black text-indigo-400">ADMIN PANEL</span>
          </div>
          <div className="text-[10px] text-slate-600">KAMIL SHOP</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/60 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronLeft size={13} /> Kembali ke Dashboard
          </Link>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-red-400 transition-colors w-full">
            <LogOut size={13} /> Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-56 min-h-screen">{children}</main>
    </div>
  );
}
