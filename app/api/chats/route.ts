import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { db } from "@/db/db";
import { chats } from "@/db/schema/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user's chats with the first user message as title
  const userChats = await db
    .select({
      id: chats.id,
      updatedAt: chats.updatedAt,
      title: sql<string>`(
        SELECT content FROM messages
        WHERE "chatId" = ${chats.id} AND role = 'user'
        ORDER BY created_at ASC
        LIMIT 1
      )`,
    })
    .from(chats)
    .where(
      and(eq(chats.userId, payload.userId), isNull(chats.archiveAt))
    )
    .orderBy(desc(chats.updatedAt));

  return NextResponse.json({ chats: userChats });
}
