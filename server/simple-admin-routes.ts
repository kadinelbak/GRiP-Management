import { Request, Response } from 'express';
import { db } from './db.js';
import { adminSignupCodes, users } from '../shared/schema.js';
import { eq, and, gt, desc } from 'drizzle-orm';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Simple token verification without session check
function verifyTokenSimple(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

// Generate admin code with simple auth
export async function generateAdminCodeSimple(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = verifyTokenSimple(token);
    if (!decoded) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    // Verify user exists and is active
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.id, decoded.userId), eq(users.isActive, true)))
      .limit(1);

    if (user.length === 0) {
      return res.status(403).json({ message: 'User not found or inactive' });
    }

    console.log('Generating admin code for user:', user[0].email);

    // Deactivate all existing codes
    await db
      .update(adminSignupCodes)
      .set({ isActive: false })
      .where(eq(adminSignupCodes.isActive, true));

    // Generate new 8-character code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const [newCode] = await db
      .insert(adminSignupCodes)
      .values({
        code,
        expiresAt,
        createdBy: decoded.userId,
      })
      .returning();

    res.json({ 
      code: newCode.code,
      expiresAt: newCode.expiresAt,
      message: 'New admin signup code generated'
    });
  } catch (error) {
    console.error('Generate admin code error:', error);
    res.status(500).json({ message: 'Failed to generate admin code' });
  }
}

// Get current admin code with simple auth
export async function getCurrentAdminCodeSimple(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = verifyTokenSimple(token);
    if (!decoded) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    // Verify user exists and is active
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.id, decoded.userId), eq(users.isActive, true)))
      .limit(1);

    if (user.length === 0) {
      return res.status(403).json({ message: 'User not found or inactive' });
    }

    console.log('Getting admin code for user:', user[0].email);

    const currentCode = await db
      .select()
      .from(adminSignupCodes)
      .where(and(
        eq(adminSignupCodes.isActive, true),
        gt(adminSignupCodes.expiresAt, new Date())
      ))
      .orderBy(desc(adminSignupCodes.createdAt))
      .limit(1);

    if (currentCode.length === 0) {
      return res.json({ 
        code: null, 
        message: 'No active admin signup code. Generate a new one.' 
      });
    }

    res.json({
      code: currentCode[0].code,
      expiresAt: currentCode[0].expiresAt,
      createdAt: currentCode[0].createdAt
    });
  } catch (error) {
    console.error('Get admin code error:', error);
    res.status(500).json({ message: 'Failed to get admin code' });
  }
}
