import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { users, sessions } from '../shared/schema.js';
import { eq, and, gt, lt } from 'drizzle-orm';

// Define user roles and their hierarchy
export const USER_ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  PRESIDENT: 'president',
  VICE_PRESIDENT: 'vice_president',
  PRINTER_MANAGER: 'printer_manager',
  MARKETING_COORDINATOR: 'marketing_coordinator',
  ART_COORDINATOR: 'art_coordinator',
  CAPTAIN: 'captain',
  MEMBER: 'member'
} as const;

// Define role permissions
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: ['*'], // All permissions
  [USER_ROLES.PROJECT_MANAGER]: [
    'access_all_admin_tabs', 'manage_users', 'view_analytics', 'manage_teams', 'manage_projects',
    'manage_events', 'manage_applications', 'view_member_roles', 'manage_special_roles',
    'manage_news', 'view_overview', 'manage_print_submissions', 'manage_marketing_requests',
    'manage_art_requests'
  ],
  [USER_ROLES.PRESIDENT]: [
    'access_all_admin_tabs', 'manage_users', 'view_analytics', 'manage_teams', 'manage_projects',
    'manage_events', 'manage_applications', 'view_member_roles', 'manage_special_roles',
    'manage_news', 'view_overview', 'manage_print_submissions', 'manage_marketing_requests',
    'manage_art_requests'
  ],
  [USER_ROLES.VICE_PRESIDENT]: [
    'access_all_admin_tabs', 'manage_users', 'view_analytics', 'manage_teams', 'manage_projects',
    'manage_events', 'manage_applications', 'view_member_roles', 'manage_special_roles',
    'manage_news', 'view_overview', 'manage_print_submissions', 'manage_marketing_requests',
    'manage_art_requests'
  ],
  [USER_ROLES.PRINTER_MANAGER]: [
    'manage_print_submissions', 'view_print_queue', 'update_print_status',
    'manage_news', 'view_overview'
  ],
  [USER_ROLES.MARKETING_COORDINATOR]: [
    'manage_marketing_requests', 'view_marketing_analytics', 'manage_social_media',
    'manage_news', 'view_overview'
  ],
  [USER_ROLES.ART_COORDINATOR]: [
    'manage_art_requests', 'view_art_projects', 'coordinate_design_work',
    'manage_news', 'view_overview'
  ],
  [USER_ROLES.CAPTAIN]: [
    'manage_members', 'view_member_roles', 'manage_teams',
    'manage_news', 'view_overview'
  ],
  [USER_ROLES.MEMBER]: [
    'view_own_profile', 'submit_applications', 'view_events',
    'manage_news', 'view_overview'
  ]
};

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
      // If JWT is valid but no session exists, create one automatically for seamless UX
      try {
        await createSession(decoded.userId, token);
        console.log('Auto-created session for valid JWT');
      } catch (sessionError) {
        console.error('Failed to create session:', sessionError);
        return res.status(403).json({ message: 'Session expired or invalid' });
      }
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

  if (req.user.role !== USER_ROLES.ADMIN) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
}

// Check if user has specific permission
export function hasPermission(userRole: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  if (!permissions) return false;
  
  // Admin has all permissions
  if (permissions.includes('*')) return true;
  
  return permissions.includes(permission);
}

// Middleware to require specific permission
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ 
        message: `Permission denied. Required permission: ${permission}` 
      });
    }

    next();
  };
}

// Middleware to require any of multiple permissions
export function requireAnyPermission(permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const hasAnyPermission = permissions.some(permission => 
      hasPermission(req.user!.role, permission)
    );

    if (!hasAnyPermission) {
      return res.status(403).json({ 
        message: `Permission denied. Required one of: ${permissions.join(', ')}` 
      });
    }

    next();
  };
}

// Middleware to require specific role
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${role}` 
      });
    }

    next();
  };
}

// Middleware to require any of multiple roles
export function requireAnyRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required one of: ${roles.join(', ')}` 
      });
    }

    next();
  };
}

// Role hierarchy for minimum role requirements
const ROLE_HIERARCHY = {
  [USER_ROLES.MEMBER]: 1,
  [USER_ROLES.CAPTAIN]: 2,
  [USER_ROLES.ART_COORDINATOR]: 3,
  [USER_ROLES.MARKETING_COORDINATOR]: 3,
  [USER_ROLES.PRINTER_MANAGER]: 4,
  [USER_ROLES.VICE_PRESIDENT]: 5,
  [USER_ROLES.PROJECT_MANAGER]: 6,
  [USER_ROLES.PRESIDENT]: 7,
  [USER_ROLES.ADMIN]: 8
};

// Middleware to require minimum role level
export function requireMinimumRole(minimumRole: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role as keyof typeof ROLE_HIERARCHY] || 0;
    const minimumRoleLevel = ROLE_HIERARCHY[minimumRole as keyof typeof ROLE_HIERARCHY] || 0;

    if (userRoleLevel < minimumRoleLevel) {
      return res.status(403).json({ 
        message: `Access denied. Minimum role required: ${minimumRole}` 
      });
    }

    next();
  };
}

// Leadership roles (admin, president, project manager)
export function requireLeadership(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const leadershipRoles = [USER_ROLES.ADMIN, USER_ROLES.PRESIDENT, USER_ROLES.PROJECT_MANAGER];
  if (!leadershipRoles.includes(req.user.role as any)) {
    return res.status(403).json({ message: 'Leadership access required' });
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
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
