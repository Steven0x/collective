import { NextResponse } from "next/server";
import { mapPins } from "@/lib/data";
export async function GET() {
  return NextResponse.json(await mapPins(), { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
