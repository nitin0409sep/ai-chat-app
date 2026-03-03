import { NextRequest, NextResponse } from "next/server";
import { getGroqChatCompletion } from "./generate";
import Redis from "ioredis";

const client = new Redis();

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  // If no message return with an error
  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "message is required" },
      { status: 400 }
    );
  }

  // 1- Store user message first
  await client.rpush(
    "chat:history",
    JSON.stringify({ role: "user", content: message })
  );

  // 2- Fetch summary (long-term memory)
  const summary = await client.get("chat:summary");

  // 3- Fetch last 5 messages (short-term memory)
  const recentMessagesRaw = await client.lrange("chat:history", -5, -1);
  const recentMessages = recentMessagesRaw.map(msg => JSON.parse(msg));

  // 4- Build final prompt
  const finalPrompt = [
    summary ? { role: "system", content: `Conversation so far: ${summary}` } : null,
    ...recentMessages
  ].filter(Boolean);

  // 5- Call LLM
  const reply = await getGroqChatCompletion(finalPrompt);

  // 6- Store assistant reply
  await client.rpush(
    "chat:history",
    JSON.stringify({ role: "assistant", content: reply })
  );

  // 7- If chat too long → regenerate summary
  const chatsLength = await client.llen("chat:history");

  if (chatsLength > 20) {
    const fullChatRaw = await client.lrange("chat:history", 0, -1);
    const fullChat = fullChatRaw.map(msg => JSON.parse(msg));

    const summaryPrompt = [
      {
        role: "system",
        content: "Summarize this conversation briefly for memory retention."
      },
      ...fullChat
    ];

    const newSummary = await getGroqChatCompletion(summaryPrompt);

    // Save summary
    await client.set("chat:summary", newSummary);

    // Keep only last 5 messages
    await client.ltrim("chat:history", -5, -1);
  }

  return NextResponse.json({ role: "assistant", content: reply });
}