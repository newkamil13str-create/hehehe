import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { createQrisPayment } from "@/lib/pakasir";
import { getSettings } from "@/lib/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { generateOrderId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const { amount } = await req.json();
    const settings = await getSettings();

    if (settings.maintenanceMode) {
      return NextResponse.json({ error: "Sistem sedang maintenance" }, { status: 503 });
    }

    const num = Number(amount);
    if (!num || num < settings.minDeposit || num > settings.maxDeposit) {
      return NextResponse.json({
        error: `Nominal deposit antara Rp ${settings.minDeposit.toLocaleString("id-ID")} - Rp ${settings.maxDeposit.toLocaleString("id-ID")}`,
      }, { status: 400 });
    }

    const pakasirOrderId = generateOrderId("KS-DEP");
    const pakasirResult = await createQrisPayment(pakasirOrderId, num);

    const expiredAt = pakasirResult.expired_at
      ? Timestamp.fromDate(new Date(pakasirResult.expired_at))
      : Timestamp.fromDate(new Date(Date.now() + 30 * 60 * 1000));

    await adminDb.doc(`deposits/${pakasirOrderId}`).set({
      depositId: pakasirOrderId,
      uid: decoded.uid,
      amount: num,
      fee: pakasirResult.fee ?? 0,
      totalPayment: pakasirResult.total ?? num,
      paymentMethod: "qris",
      pakasirOrderId,
      paymentNumber: pakasirResult.payment_number,
      expiredAt,
      status: "pending",
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({
      depositId: pakasirOrderId,
      paymentNumber: pakasirResult.payment_number,
      totalPayment: pakasirResult.total ?? num,
      expiredAt: pakasirResult.expired_at ?? new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Gagal membuat pembayaran" }, { status: 500 });
  }
}
