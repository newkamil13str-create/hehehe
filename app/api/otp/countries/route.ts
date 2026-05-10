import { NextResponse } from "next/server";
import { getNegara } from "@/lib/jasaotp";

export async function GET() {
  try {
    const countries = await getNegara();
    return NextResponse.json({ countries });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
