import { NextResponse } from "next/server";
import { deriveDashboard } from "@/lib/derive";
import { getMcpData } from "@/lib/mcp";

export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json(deriveDashboard(await getMcpData())); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load CRM" }, { status: 503 }); }
}
