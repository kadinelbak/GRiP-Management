import dotenv from 'dotenv';
dotenv.config();

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";
import { users } from "../shared/schema.js";
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

async function checkUser() {
  try {
    const email = "kelbakkouri@ufl.edu";
    
    console.log(`Checking if user exists: ${email}`);
    
    // Check if user exists
    const existingUser = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser.length > 0) {
      const user = existingUser[0];
      console.log("✅ User found:");
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt}`);
      
      if (user.role === 'admin') {
        console.log("✅ This user has ADMIN privileges");
      } else {
        console.log("❌ This user does NOT have admin privileges (role: " + user.role + ")");
      }
      
      if (!user.isActive) {
        console.log("❌ This user is INACTIVE");
      }
    } else {
      console.log("❌ User not found in database");
    }
    
    // Also list all admin users
    console.log("\n--- All Admin Users ---");
    const allAdmins = await db
      .select({
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive
      })
      .from(users)
      .where(eq(users.role, 'admin'));
    
    if (allAdmins.length > 0) {
      allAdmins.forEach(admin => {
        console.log(`📧 ${admin.email} - ${admin.firstName} ${admin.lastName} (Active: ${admin.isActive})`);
      });
    } else {
      console.log("No admin users found in database");
    }
    
  } catch (error) {
    console.error("Error checking user:", error);
  } finally {
    process.exit(0);
  }
}

checkUser();
