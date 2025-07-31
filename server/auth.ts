import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { users, sessions } from '../shared/schema.js';
import { eq, and, gt } from 'drizzle-orm';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Hash password utility
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password utility
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

// Authentication middleware
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('JWT verification failed');
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    console.log('JWT verified for user:', decoded.userId);

    // Check if session exists and is valid
    const validSession = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, decoded.userId),
          eq(sessions.token, token),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    console.log('Valid sessions found:', validSession.length);
    if (validSession.length === 0) {
      // Check if any sessions exist for this user
      const allUserSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, decoded.userId));
      console.log('Total sessions for user:', allUserSessions.length);
      console.log('Current time:', new Date().toISOString());
      if (allUserSessions.length > 0) {
        console.log('Latest session expires at:', allUserSessions[0].expiresAt);
        console.log('Session token matches:', allUserSessions[0].token === token);
      }
      return res.status(403).json({ message: 'Session expired or invalid' });
    }

    // Get user details
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(and(eq(users.id, decoded.userId), eq(users.isActive, true)))
      .limit(1);

    if (user.length === 0) {
      return res.status(403).json({ message: 'User not found or inactive' });
    }

    req.user = {
      id: user[0].id,
      email: user[0].email,
      role: user[0].role,
      firstName: user[0].firstName || undefined,
      lastName: user[0].lastName || undefined,
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
}

// Admin-only middleware
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
}

// Member or Admin middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  next();
}

// Create session in database
export async function createSession(userId: string, token: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });
}

// Delete session (logout)
export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(gt(sessions.expiresAt, new Date()));
}
