import dotenv from 'dotenv';
dotenv.config();

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Export all schema tables for use in routes
export const { 
  applications, 
  teams, 
  projectRequests, 
  events, 
  eventAttendance, 
  printSubmissions, 
  absences, 
  specialRoles, 
  roleApplications, 
  memberRoles, 
  marketingRequests,
  additionalTeamSignups
} = schema;