CREATE TABLE "news_approvals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" varchar NOT NULL,
	"approver_id" varchar NOT NULL,
	"approved" boolean NOT NULL,
	"comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_stories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"summary" text,
	"type" text NOT NULL,
	"image_url" text,
	"link_url" text,
	"tags" json DEFAULT '[]'::json NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"author_id" varchar NOT NULL,
	"publish_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "news_approvals" ADD CONSTRAINT "news_approvals_story_id_news_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."news_stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_approvals" ADD CONSTRAINT "news_approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_stories" ADD CONSTRAINT "news_stories_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;