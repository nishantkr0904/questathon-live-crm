import { NextRequest, NextResponse } from "next/server";
import { writeCrmNote } from "@/lib/mcp";

export async function POST(request: NextRequest) {
  try {
    const { text, account, kind, title } = await request.json();
    if (!text || typeof text !== "string") return NextResponse.json({ error: "text is required" }, { status: 400 });
    return NextResponse.json(await writeCrmNote(text, account, kind, title));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to write note" }, { status: 429 }); }
}
