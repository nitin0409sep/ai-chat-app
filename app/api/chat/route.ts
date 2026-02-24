import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "message is required" },
      { status: 400 }
    );
  }

  // TODO: replace with actual LLM call
  const reply = `You said: "${message}"`;

  return NextResponse.json({ role: "assistant", content: reply });
}
