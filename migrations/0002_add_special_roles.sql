
CREATE TABLE IF NOT EXISTS "special_roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"responsibilities" text,
	"requirements" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "special_roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" varchar NOT NULL,
	"applicant_name" text NOT NULL,
	"applicant_email" text NOT NULL,
	"ufid" text NOT NULL,
	"current_team" text,
	"experience" text,
	"motivation" text,
	"availability" text,
	"additional_info" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"review_notes" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member_roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" varchar NOT NULL,
	"role_id" varchar NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "role_applications" ADD CONSTRAINT "role_applications_role_id_special_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."special_roles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_roles" ADD CONSTRAINT "member_roles_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_roles" ADD CONSTRAINT "member_roles_role_id_special_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."special_roles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Insert some default special roles
INSERT INTO "special_roles" ("name", "description", "responsibilities", "requirements") VALUES
('Team Leader', 'Lead and coordinate team activities', 'Organize meetings, delegate tasks, communicate with admin team', 'Previous leadership experience, strong communication skills'),
('Designer', 'Create visual content and design materials', 'Design promotional materials, social media graphics, presentations', 'Experience with design software, creative portfolio'),
('Coordinator', 'Coordinate events and logistics', 'Plan events, manage schedules, coordinate between teams', 'Organizational skills, attention to detail'),
('Social Media Manager', 'Manage social media presence', 'Create content, manage posts, engage with community', 'Social media experience, content creation skills'),
('Project Manager', 'Oversee project development and timelines', 'Track project progress, manage deadlines, facilitate communication', 'Project management experience, organizational skills');
