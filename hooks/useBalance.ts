"use client";
import { useAuth } from "./useAuth";
import { formatRupiah } from "@/lib/utils";

export function useBalance() {
  const { userData } = useAuth();
  const balance = userData?.balance ?? 0;
  return {
    balance,
    balanceFormatted: formatRupiah(balance),
    isLoaded: userData !== null,
  };
}
