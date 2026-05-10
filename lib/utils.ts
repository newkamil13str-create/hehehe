import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | { toDate(): Date } | string): string {
  let d: Date;
  if (typeof date === "string") d = new Date(date);
  else if ("toDate" in date) d = date.toDate();
  else d = date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function generateOrderId(prefix = "KS"): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    waiting: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    received: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
    expired: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  return map[status] ?? "bg-gray-500/15 text-gray-400 border-gray-500/30";
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    waiting: "Menunggu",
    received: "Diterima",
    cancelled: "Dibatalkan",
    expired: "Kedaluwarsa",
    pending: "Menunggu",
    paid: "Dibayar",
  };
  return map[status] ?? status;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
