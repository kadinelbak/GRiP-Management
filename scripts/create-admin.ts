import dotenv from 'dotenv';
dotenv.config();

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";
import { users } from "../shared/schema.js";
import { hashPassword } from "../server/auth.js";
import { eq } from "drizzle-orm";

// Configure Neon WebSocket
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function createInitialAdmin() {
  try {
    const email = "kelbakkouri@ufl.edu";
    const password = "9904kaEB%5";
    const firstName = "Kadin";
    const lastName = "El Bakkouri";
    
    console.log("Creating initial admin user...");
    
    // Check if admin already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser.length > 0) {
      console.log("Admin user already exists with email:", email);
      process.exit(0);
    }
    
    // Hash the password
    const passwordHash = await hashPassword(password);
    
    // Create the admin user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        role: "admin",
        firstName,
        lastName,
        isActive: true,
      })
      .returning();
    
    console.log("✅ Initial admin user created successfully!");
    console.log("Email:", email);
    console.log("Role: admin");
    console.log("User ID:", newUser.id);
    
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
createInitialAdmin();
