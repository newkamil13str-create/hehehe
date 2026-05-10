import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  title: "KAMIL SHOP — OTP Virtual Number Terpercaya",
  description:
    "Platform reseller OTP terpercaya. Beli nomor virtual untuk verifikasi WhatsApp, Facebook, Telegram, dan 200+ layanan. Harga mulai Rp 1.500, proses instan.",
  keywords: ["OTP", "virtual number", "nomor virtual", "WhatsApp OTP", "SMS OTP", "KAMIL SHOP"],
  authors: [{ name: "KAMIL SHOP", url: "https://kamilshop.my.id" }],
  creator: "KAMIL SHOP",
  openGraph: {
    title: "KAMIL SHOP — OTP Virtual Number Terpercaya",
    description: "Beli nomor virtual OTP untuk 200+ layanan. Harga mulai Rp 1.500.",
    url: "https://kamilshop.my.id",
    siteName: "KAMIL SHOP",
    locale: "id_ID",
    type: "website",
  },
  robots: { index: true, follow: true },
  metadataBase: new URL("https://kamilshop.my.id"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-[#080e1a] text-slate-100 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e293b",
              color: "#f1f5f9",
              border: "1px solid #334155",
              borderRadius: "12px",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
