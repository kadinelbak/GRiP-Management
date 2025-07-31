import { db } from './db.js';
import { users } from '../shared/schema.js';
import { hashPassword } from './auth.js';
import { eq } from 'drizzle-orm';

// Setup initial admin user from environment variables
export async function setupInitialAdmin() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
  const adminFirstName = process.env.INITIAL_ADMIN_FIRST_NAME || 'Admin';
  const adminLastName = process.env.INITIAL_ADMIN_LAST_NAME || 'User';

  if (!adminEmail || !adminPassword) {
    console.log('No initial admin credentials found in environment variables');
    return;
  }

  try {
    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('Initial admin already exists');
      return;
    }

    // Create initial admin
    const hashedPassword = await hashPassword(adminPassword);
    
    await db.insert(users).values({
      email: adminEmail,
      passwordHash: hashedPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: 'admin',
      isActive: true,
    });

    console.log(`Initial admin user created: ${adminEmail}`);
  } catch (error) {
    console.error('Error setting up initial admin:', error);
  }
}
