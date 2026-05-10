import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, status, amount } = body;

    // Verify callback secret from Pakasir
    const secret = req.headers.get("x-callback-secret") ?? req.nextUrl.searchParams.get("secret");
    if (process.env.PAYMENT_CALLBACK_SECRET && secret !== process.env.PAYMENT_CALLBACK_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    if (!order_id) return NextResponse.json({ error: "order_id required" }, { status: 400 });

    const depositRef = adminDb.doc(`deposits/${order_id}`);
    const depositSnap = await depositRef.get();

    if (!depositSnap.exists) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    const deposit = depositSnap.data()!;

    // Idempotent
    if (deposit.status === "paid") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    if (status !== "paid" && status !== "success" && status !== "settlement") {
      await depositRef.update({ status: "expired", updatedAt: Timestamp.now() });
      return NextResponse.json({ success: true });
    }

    // Atomic: mark paid + add balance
    await adminDb.runTransaction(async (tx) => {
      tx.update(depositRef, {
        status: "paid",
        updatedAt: Timestamp.now(),
      });
      tx.update(adminDb.doc(`users/${deposit.uid}`), {
        balance: FieldValue.increment(deposit.amount),
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Callback error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Also handle GET for some gateways
export async function GET(req: NextRequest) {
  return POST(req);
}
