import { NextRequest, NextResponse } from "next/server";
import { getGroqChatCompletion } from "./generate";
import Redis from "ioredis";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { db } from "@/db/db";
import { chats, messages } from "@/db/schema/schema";
import { eq } from "drizzle-orm";

const client = new Redis();

export async function POST(req: NextRequest) {
  // Authenticate user
  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, chatId: existingChatId } = await req.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "message is required" },
      { status: 400 }
    );
  }

  // Resolve or create chat
  let chatId: string;

  if (existingChatId) {
    // Verify chat belongs to this user
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, existingChatId))
      .limit(1);

    if (!chat || chat.userId !== payload.userId) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    chatId = existingChatId;
  } else {
    // Create new chat
    const [newChat] = await db
      .insert(chats)
      .values({ userId: payload.userId })
      .returning({ id: chats.id });
    chatId = newChat.id;
  }

  // Per-chat Redis keys
  const historyKey = `chat:${chatId}:history`;
  const summaryKey = `chat:${chatId}:summary`;

  // 1- Store user message in Redis
  await client.rpush(
    historyKey,
    JSON.stringify({ role: "user", content: message })
  );

  // 2- Fetch summary (long-term memory)
  const summary = await client.get(summaryKey);

  // 3- Fetch last 5 messages (short-term memory)
  const recentMessagesRaw = await client.lrange(historyKey, -5, -1);
  const recentMessages = recentMessagesRaw.map((msg) => JSON.parse(msg));

  // 4- Build final prompt
  const finalPrompt = [
    summary
      ? { role: "system", content: `Conversation so far: ${summary}` }
      : null,
    ...recentMessages,
  ].filter(Boolean);

  // 5- Call LLM
  const reply = await getGroqChatCompletion(finalPrompt);

  // 6- Store assistant reply in Redis
  await client.rpush(
    historyKey,
    JSON.stringify({ role: "assistant", content: reply })
  );

  // 7- Persist both messages to DB
  await db.insert(messages).values([
    { chatId, role: "user" as const, content: message },
    { chatId, role: "assistant" as const, content: reply },
  ]);

  // 8- Update chat's updatedAt
  await db
    .update(chats)
    .set({ updatedAt: new Date() })
    .where(eq(chats.id, chatId));

  // 9- If chat too long → regenerate summary
  const chatsLength = await client.llen(historyKey);

  if (chatsLength > 20) {
    const fullChatRaw = await client.lrange(historyKey, 0, -1);
    const fullChat = fullChatRaw.map((msg) => JSON.parse(msg));

    const summaryPrompt = [
      {
        role: "system",
        content: "Summarize this conversation briefly for memory retention.",
      },
      ...fullChat,
    ];

    const newSummary = await getGroqChatCompletion(summaryPrompt);

    await client.set(summaryKey, newSummary);
    await client.ltrim(historyKey, -5, -1);

    // Also persist summary to DB
    await db
      .update(chats)
      .set({ summary: newSummary })
      .where(eq(chats.id, chatId));
  }

  return NextResponse.json({ role: "assistant", content: reply, chatId });
}
