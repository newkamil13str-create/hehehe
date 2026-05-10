import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { buyNumber, getLayanan } from "@/lib/jasaotp";
import { deductBalance, createOrderAdmin, getSettings, addBalance } from "@/lib/firestore";
import { generateOrderId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const { layanan, negara, operator } = await req.json();

    if (!layanan || !negara || !operator) {
      return NextResponse.json({ error: "layanan, negara, dan operator wajib diisi" }, { status: 400 });
    }

    const [services, settings] = await Promise.all([
      getLayanan(negara),
      getSettings(),
    ]);

    if (settings.maintenanceMode) {
      return NextResponse.json({ error: "Sistem sedang dalam maintenance. Coba lagi nanti." }, { status: 503 });
    }

    const service = services.find((s: any) => s.code === layanan);
    if (!service) return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
    if (service.stok === 0) return NextResponse.json({ error: "Stok habis untuk layanan ini" }, { status: 400 });

    const harga = service.harga + settings.markup;

    // Deduct balance first (atomic)
    await deductBalance(decoded.uid, harga);

    // Try to buy number
    let jasaResult: any;
    try {
      jasaResult = await buyNumber(layanan, negara, operator);
    } catch (err) {
      // Refund on API failure
      await addBalance(decoded.uid, harga);
      throw new Error("Gagal mendapatkan nomor dari provider. Saldo telah dikembalikan.");
    }

    if (!jasaResult?.order_id || !jasaResult?.number) {
      await addBalance(decoded.uid, harga);
      return NextResponse.json({ error: "Nomor tidak tersedia. Saldo dikembalikan." }, { status: 500 });
    }

    const orderId = generateOrderId("KS");

    await createOrderAdmin({
      orderId,
      uid: decoded.uid,
      jasaOrderId: jasaResult.order_id,
      number: jasaResult.number,
      negara,
      namaLayanan: service.name,
      layananCode: layanan,
      operator,
      harga,
      status: "waiting",
      otp: null,
    });

    return NextResponse.json({ orderId, number: jasaResult.number });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan" }, { status: 500 });
  }
}
