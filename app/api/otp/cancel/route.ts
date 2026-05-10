import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { cancelNumber } from "@/lib/jasaotp";
import { getOrderAdmin } from "@/lib/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const { orderId } = await req.json();

    const order = await getOrderAdmin(orderId);
    if (!order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    if (order.uid !== decoded.uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (order.status !== "waiting") return NextResponse.json({ error: "Order sudah tidak bisa dibatalkan" }, { status: 400 });

    // Cancel at provider (best effort)
    try { await cancelNumber(order.jasaOrderId); } catch {}

    // Atomic: cancel order + refund balance
    await adminDb.runTransaction(async (tx) => {
      tx.update(adminDb.doc(`orders/${orderId}`), {
        status: "cancelled",
        updatedAt: Timestamp.now(),
      });
      tx.update(adminDb.doc(`users/${decoded.uid}`), {
        balance: FieldValue.increment(order.harga),
      });
    });

    return NextResponse.json({ success: true, refunded: order.harga });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
