import {
    pgEnum,
    pgTable,
    uniqueIndex,
    uuid,
    varchar,
    timestamp,
} from "drizzle-orm/pg-core";

// Enum
export const rolesEnum = pgEnum("roles", ["user", "admin", "guest"]);

// Users Table
export const users = pgTable(
    "users",
    {
        id: uuid("id")
            .defaultRandom()
            .primaryKey(),
        firstName: varchar("first_name", { length: 256 }),
        lastName: varchar("last_name", { length: 256 }),
        email: varchar("email", { length: 256 }).notNull(),
        password: varchar("password", { length: 256 }).notNull(),
        role: rolesEnum("role").default("guest"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        archiveAt: timestamp("archiveAt", { withTimezone: true }),
    },
    (table) => [
        uniqueIndex("email_idx").on(table.email),
    ]
);