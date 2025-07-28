
CREATE TABLE "print_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"submitter_name" text NOT NULL,
	"email_address" text NOT NULL,
	"request_type" text NOT NULL,
	"team_name" text,
	"color" text,
	"upload_files" text,
	"general_print_description" text,
	"file_specifications" text,
	"comments" text,
	"deadline" timestamp,
	"status" text DEFAULT 'submitted' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
