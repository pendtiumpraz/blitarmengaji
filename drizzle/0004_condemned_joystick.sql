CREATE TYPE "public"."wa_ingest_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."wa_ingest_type" AS ENUM('kajian', 'faedah');--> statement-breakpoint
ALTER TYPE "public"."ai_task" ADD VALUE 'wa_extract';--> statement-breakpoint
CREATE TABLE "wa_ingest_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid,
	"type" "wa_ingest_type" NOT NULL,
	"status" "wa_ingest_status" DEFAULT 'pending' NOT NULL,
	"payload_json" jsonb,
	"titik_dakwah_id" uuid,
	"image_url" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wa_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" varchar(64),
	"group_jid" varchar(128),
	"group_name" varchar(255),
	"sender" varchar(128),
	"push_name" varchar(255),
	"text" text,
	"has_image" boolean DEFAULT false NOT NULL,
	"image_url" text,
	"wa_message_id" varchar(128),
	"wa_timestamp" timestamp with time zone,
	"classification" varchar(32),
	"status" varchar(32) DEFAULT 'received' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wa_ingest_queue" ADD CONSTRAINT "wa_ingest_queue_message_id_wa_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."wa_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wa_ingest_queue" ADD CONSTRAINT "wa_ingest_queue_titik_dakwah_id_titik_dakwah_id_fk" FOREIGN KEY ("titik_dakwah_id") REFERENCES "public"."titik_dakwah"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wa_ingest_queue" ADD CONSTRAINT "wa_ingest_queue_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wa_ingest_status_idx" ON "wa_ingest_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "wa_messages_group_idx" ON "wa_messages" USING btree ("group_jid");--> statement-breakpoint
CREATE INDEX "wa_messages_msgid_idx" ON "wa_messages" USING btree ("wa_message_id");