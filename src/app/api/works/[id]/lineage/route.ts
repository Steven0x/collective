import { NextResponse } from "next/server";
import { lineageFor } from "@/lib/data";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await lineageFor(id);
  if (!l) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(l, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
