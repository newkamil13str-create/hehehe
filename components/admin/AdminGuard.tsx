"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { userData, loading, firebaseUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!firebaseUser || userData?.role !== "admin")) {
      router.replace("/dashboard");
    }
  }, [loading, firebaseUser, userData, router]);

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    );
  }

  if (userData.role !== "admin") return null;

  return <>{children}</>;
}
