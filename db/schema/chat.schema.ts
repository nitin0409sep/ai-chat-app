import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const chats = pgTable("chats", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    summary: text(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    archiveAt: timestamp("archiveAt", { withTimezone: true }),
});
