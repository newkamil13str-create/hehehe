import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

async function verifyAdmin(token: string) {
  const decoded = await adminAuth.verifyIdToken(token);
  const snap = await adminDb.doc(`users/${decoded.uid}`).get();
  if (snap.data()?.role !== "admin") throw new Error("Forbidden");
  return decoded;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await verifyAdmin(token);

    const { depositId } = await req.json();
    const depositRef = adminDb.doc(`deposits/${depositId}`);
    const snap = await depositRef.get();

    if (!snap.exists) return NextResponse.json({ error: "Deposit tidak ditemukan" }, { status: 404 });
    const deposit = snap.data()!;
    if (deposit.status === "paid") return NextResponse.json({ error: "Deposit sudah diproses" }, { status: 400 });

    await adminDb.runTransaction(async (tx) => {
      tx.update(depositRef, { status: "paid", approvedAt: Timestamp.now(), approvedManually: true });
      tx.update(adminDb.doc(`users/${deposit.uid}`), { balance: FieldValue.increment(deposit.amount) });
    });

    return NextResponse.json({ success: true, amount: deposit.amount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
