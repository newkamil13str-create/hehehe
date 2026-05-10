import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { cancelNumber } from "@/lib/jasaotp";
import { getOrderAdmin } from "@/lib/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

async function verifyAdmin(token: string) {
  const decoded = await adminAuth.verifyIdToken(token);
  const userSnap = await adminDb.doc(`users/${decoded.uid}`).get();
  if (userSnap.data()?.role !== "admin") throw new Error("Forbidden");
  return decoded;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await verifyAdmin(token);

    const { orderId } = await req.json();
    const order = await getOrderAdmin(orderId);
    if (!order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    if (order.status !== "waiting") return NextResponse.json({ error: "Order tidak bisa dibatalkan" }, { status: 400 });

    try { await cancelNumber(order.jasaOrderId); } catch {}

    await adminDb.runTransaction(async (tx) => {
      tx.update(adminDb.doc(`orders/${orderId}`), { status: "cancelled", updatedAt: Timestamp.now() });
      tx.update(adminDb.doc(`users/${order.uid}`), { balance: FieldValue.increment(order.harga) });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
