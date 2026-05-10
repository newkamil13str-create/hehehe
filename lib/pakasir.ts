import type { PakasirResult } from "@/types";

const BASE = process.env.PAKASIR_BASE_URL ?? "https://app.pakasir.com/api";

export async function createQrisPayment(
  orderId: string,
  amount: number
): Promise<PakasirResult> {
  const apiKey = process.env.PAKASIR_API_KEY;
  const project = process.env.PAKASIR_PROJECT;

  if (!apiKey || !project) throw new Error("Pakasir credentials tidak dikonfigurasi");

  const res = await fetch(`${BASE}/transactioncreate/qris`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "KamilShop/1.0",
    },
    body: JSON.stringify({
      project,
      order_id: orderId,
      amount,
      api_key: apiKey,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pakasir API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function checkPaymentStatus(orderId: string): Promise<{ status: string }> {
  const apiKey = process.env.PAKASIR_API_KEY;
  const project = process.env.PAKASIR_PROJECT;

  const res = await fetch(`${BASE}/transactionstatus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, order_id: orderId, api_key: apiKey }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Pakasir status error: ${res.status}`);
  return res.json();
}
