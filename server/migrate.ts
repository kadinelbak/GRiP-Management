
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
