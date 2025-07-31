import dotenv from 'dotenv';
dotenv.config();

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";
import { users } from "../shared/schema.js";
import { verifyPassword } from "../server/auth.js";
import { eq } from "drizzle-orm";

// Configure Neon WebSocket
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function testLogin() {
  try {
    const email = "kelbakkouri@ufl.edu";
    const password = "9904kaEB%5";
    
    console.log(`Testing login for: ${email}`);
    
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (user.length === 0) {
      console.log("❌ User not found");
      return;
    }
    
    const userData = user[0];
    console.log(`✅ User found: ${userData.firstName} ${userData.lastName}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Active: ${userData.isActive}`);
    
    const isValidPassword = await verifyPassword(password, userData.passwordHash);
    
    if (isValidPassword) {
      console.log("✅ Password is correct");
      console.log("✅ This is a valid admin account!");
    } else {
      console.log("❌ Password is incorrect");
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testLogin();
