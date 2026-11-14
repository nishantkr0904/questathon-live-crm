import { NextResponse } from "next/server";
import { deriveDashboard } from "@/lib/derive";
import { getMcpData } from "@/lib/mcp";

export async function POST() {
  try { return NextResponse.json(deriveDashboard(await getMcpData(true))); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to refresh signals" }, { status: 429 }); }
}
