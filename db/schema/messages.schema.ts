import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { chats } from "./chat.schema";

// Enum
export const llmRolesEnum = pgEnum("llmRoles", [
    "user",
    "assistant",
]);

export const messages = pgTable("messages", {
    id: uuid("id").defaultRandom().primaryKey(),
    chatId: uuid("chatId")
        .references(() => chats.id, { onDelete: "cascade" })
        .notNull(),
    role: llmRolesEnum("role").notNull(),
    content: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    archiveAt: timestamp("archiveAt", { withTimezone: true }),
})