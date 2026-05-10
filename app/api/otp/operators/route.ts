import { NextRequest, NextResponse } from "next/server";
import { getOperator } from "@/lib/jasaotp";

export async function GET(req: NextRequest) {
  try {
    const negara = Number(req.nextUrl.searchParams.get("negara"));
    if (!negara) return NextResponse.json({ error: "negara required" }, { status: 400 });
    const operators = await getOperator(negara);
    return NextResponse.json({ operators });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
