import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { checkOtp } from "@/lib/jasaotp";
import { getOrderAdmin, updateOrderOtp } from "@/lib/firestore";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const { orderId } = await req.json();

    const order = await getOrderAdmin(orderId);
    if (!order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    if (order.uid !== decoded.uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (order.status === "received") return NextResponse.json({ otp: order.otp, status: "received" });
    if (order.status !== "waiting") return NextResponse.json({ otp: null, status: order.status });

    const result = await checkOtp(order.jasaOrderId);

    if (result?.sms) {
      await updateOrderOtp(orderId, result.sms);
      return NextResponse.json({ otp: result.sms, status: "received" });
    }

    return NextResponse.json({ otp: null, status: "waiting" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
