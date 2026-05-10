import type { JasaCountry, JasaService, JasaOperator, JasaOrderResult, JasaOtpResult } from "@/types";

const BASE = process.env.JASAOTP_BASE_URL ?? "https://api.jasaotp.id/v1";

async function jasaFetch(path: string, params: Record<string, string | number> = {}) {
  const apiKey = process.env.JASAOTP_API_KEY;
  if (!apiKey) throw new Error("JASAOTP_API_KEY tidak dikonfigurasi");

  const qs = new URLSearchParams({
    api_key: apiKey,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });

  const res = await fetch(`${BASE}/${path}?${qs}`, {
    cache: "no-store",
    headers: { "User-Agent": "KamilShop/1.0" },
  });

  if (!res.ok) throw new Error(`Jasa OTP API error: ${res.status}`);
  return res.json();
}

export async function getNegara(): Promise<JasaCountry[]> {
  const data = await jasaFetch("negara.php");
  return Array.isArray(data) ? data : [];
}

export async function getLayanan(negara: number): Promise<JasaService[]> {
  const data = await jasaFetch("layanan.php", { negara });
  return Array.isArray(data) ? data : [];
}

export async function getOperator(negara: number): Promise<JasaOperator[]> {
  const data = await jasaFetch("operator.php", { negara });
  return Array.isArray(data) ? data : [];
}

export async function buyNumber(
  layanan: string,
  negara: number,
  operator: string
): Promise<JasaOrderResult> {
  return jasaFetch("order.php", { layanan, negara, operator });
}

export async function checkOtp(jasaOrderId: number): Promise<JasaOtpResult> {
  return jasaFetch("sms.php", { id: jasaOrderId });
}

export async function cancelNumber(jasaOrderId: number): Promise<unknown> {
  return jasaFetch("cancel.php", { id: jasaOrderId });
}
