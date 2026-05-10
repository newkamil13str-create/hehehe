import { NextRequest, NextResponse } from "next/server";
import { getLayanan } from "@/lib/jasaotp";
import { getSettings } from "@/lib/firestore";

export async function GET(req: NextRequest) {
  try {
    const negara = Number(req.nextUrl.searchParams.get("negara"));
    if (!negara) return NextResponse.json({ error: "negara required" }, { status: 400 });
    const [services, settings] = await Promise.all([getLayanan(negara), getSettings()]);
    return NextResponse.json({ services, markup: settings.markup });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
