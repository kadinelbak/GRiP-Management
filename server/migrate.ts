
import { db } from "./db.js";
import { sql } from "drizzle-orm";

async function migrate() {
  try {
    console.log("Starting database migration...");
    
    // Add firstName and lastName columns to applications table
    await db.execute(sql`
      ALTER TABLE applications 
      ADD COLUMN IF NOT EXISTS first_name TEXT,
      ADD COLUMN IF NOT EXISTS last_name TEXT,
      ADD COLUMN IF NOT EXISTS assignment_reason TEXT
    `);
    
    // Add address column to project_requests table
    await db.execute(sql`
      ALTER TABLE project_requests 
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS responsible_person TEXT
    `);
    
    // Create absences table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS absences (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id VARCHAR NOT NULL REFERENCES applications(id),
        reason TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Add points and events columns to applications table
    await db.execute(sql`
      ALTER TABLE applications 
      ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS events JSON NOT NULL DEFAULT '[]'::json
    `);

    // Create events table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        event_date TIMESTAMP NOT NULL,
        location TEXT NOT NULL,
        points INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create event_attendance table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS event_attendance (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR NOT NULL REFERENCES events(id),
        full_name TEXT NOT NULL,
        ufid TEXT NOT NULL,
        photo TEXT,
        social_media_permission BOOLEAN NOT NULL DEFAULT false,
        status TEXT NOT NULL DEFAULT 'pending',
        submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
        approved_at TIMESTAMP,
        approved_by TEXT
      )
    `);

    // Add deadline column to print_submissions table
    await db.execute(sql`
      ALTER TABLE print_submissions 
      ADD COLUMN IF NOT EXISTS deadline TIMESTAMP
    `);

    // Create special roles tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "special_roles" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "responsibilities" text,
        "requirements" text,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "special_roles_name_unique" UNIQUE("name")
      )
    `);

    await db.execute(sql`
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
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "member_roles" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "application_id" varchar NOT NULL,
        "role_id" varchar NOT NULL,
        "assigned_at" timestamp DEFAULT now() NOT NULL,
        "assigned_by" text,
        "is_active" boolean DEFAULT true NOT NULL
      )
    `);

    // Add foreign key constraints
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "role_applications" ADD CONSTRAINT "role_applications_role_id_special_roles_id_fk" 
        FOREIGN KEY ("role_id") REFERENCES "public"."special_roles"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "member_roles" ADD CONSTRAINT "member_roles_application_id_applications_id_fk" 
        FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "member_roles" ADD CONSTRAINT "member_roles_role_id_special_roles_id_fk" 
        FOREIGN KEY ("role_id") REFERENCES "public"."special_roles"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Special roles table created - no default roles inserted
    // Admins can create roles through the admin dashboard
    
    console.log("Database migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate().then(() => {
  console.log("Migration finished. You can now restart your application.");
  process.exit(0);
});
