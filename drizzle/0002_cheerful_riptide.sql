CREATE TYPE "public"."ai_model_kind" AS ENUM('chat', 'reasoning', 'embedding', 'vision', 'multimodal');--> statement-breakpoint
CREATE TYPE "public"."ai_task" AS ENUM('chat', 'agent', 'doc', 'embedding', 'transcribe', 'summarize', 'vision');--> statement-breakpoint
CREATE TABLE "ai_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"model_id" varchar(160) NOT NULL,
	"label" varchar(160) NOT NULL,
	"kind" "ai_model_kind" DEFAULT 'chat' NOT NULL,
	"context_window" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
CREATE TABLE "ai_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"base_url" text NOT NULL,
	"api_key_ciphertext" text,
	"api_key_iv" text,
	"api_key_tag" text,
	"docs_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
CREATE TABLE "ai_task_bindings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task" "ai_task" NOT NULL,
	"model_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
ALTER TABLE "ai_models" ADD CONSTRAINT "ai_models_provider_id_ai_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ai_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_task_bindings" ADD CONSTRAINT "ai_task_bindings_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_models_provider_idx" ON "ai_models" USING btree ("provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_providers_slug_active_idx" ON "ai_providers" USING btree ("slug") WHERE "ai_providers"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_task_bindings_task_active_idx" ON "ai_task_bindings" USING btree ("task") WHERE "ai_task_bindings"."deleted_at" is null;