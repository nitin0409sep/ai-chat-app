CREATE TYPE "public"."roles" AS ENUM('user', 'admin', 'guest');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(256),
	"last_name" varchar(256),
	"email" varchar(256) NOT NULL,
	"role" "roles" DEFAULT 'guest',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "users" USING btree ("email");