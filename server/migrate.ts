
import { db } from "./db";
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
