import { Request, Response } from 'express';
import { db } from './db.js';
import { users, sessions, passwordResets, adminSignupCodes } from '../shared/schema.js';
import { 
  insertUserSchema, 
  loginSchema, 
  changePasswordSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  signupSchema
} from '../shared/schema.js';
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  createSession, 
  deleteSession,
  cleanupExpiredSessions
} from './auth.js';
import { verifySimpleAdminCode } from './ultra-simple-admin.js';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';

// Register new user (admin only)
export async function register(req: Request, res: Response) {
  try {
    const userData = insertUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: userData.email,
        passwordHash: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      });

    res.status(201).json({ 
      message: 'User created successfully', 
      user: newUser 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
}

// Public signup with admin code
export async function signup(req: Request, res: Response) {
  try {
    const signupData = signupSchema.parse(req.body);
    
    // Verify admin signup code using ultra-simple method
    if (!verifySimpleAdminCode(signupData.adminCode)) {
      return res.status(400).json({ message: 'Invalid or expired admin signup code' });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, signupData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await hashPassword(signupData.password);

    // Create user with selected role
    const [newUser] = await db
      .insert(users)
      .values({
        email: signupData.email,
        passwordHash: hashedPassword,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        role: signupData.role, // Use the role selected during signup
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      });

    res.status(201).json({ 
      message: 'Admin account created successfully', 
      user: newUser 
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Failed to create account' });
  }
}

// Login
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.isActive, true)))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await verifyPassword(password, user[0].passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user[0].id);

    // Create session
    await createSession(user[0].id, token);

    // Update last login
    await db
      .update(users)
      .set({ lastLogin: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user[0].id));

    // Clean up expired sessions
    await cleanupExpiredSessions();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user[0].id,
        email: user[0].email,
        firstName: user[0].firstName,
        lastName: user[0].lastName,
        role: user[0].role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
}

// Logout
export async function logout(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      await deleteSession(token);
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
}

// Get current user info
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    res.json({ user: req.user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Failed to get user info' });
  }
}

// Change password
export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // Get current user with password hash
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const validPassword = await verifyPassword(currentPassword, user[0].passwordHash);
    if (!validPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await db
      .update(users)
      .set({ 
        passwordHash: hashedNewPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, req.user.id));

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
}

// Request password reset
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { email } = resetPasswordRequestSchema.parse(req.body);

    // Check if user exists
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.isActive, true)))
      .limit(1);

    // Always return success for security (don't reveal if email exists)
    if (user.length === 0) {
      return res.json({ message: 'If an account with that email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Save reset token
    await db.insert(passwordResets).values({
      email,
      token: resetToken,
      expiresAt,
    });

    // TODO: Send email with reset link
    // For now, log the token (in production, send via email)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({ message: 'If an account with that email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Failed to request password reset' });
  }
}

// Reset password
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    // Find valid reset token
    const resetRequest = await db
      .select()
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.token, token),
          eq(passwordResets.used, false),
          eq(passwordResets.expiresAt, new Date()) // Token not expired
        )
      )
      .limit(1);

    if (resetRequest.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, resetRequest[0].email))
      .limit(1);

    if (user.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db
      .update(users)
      .set({ 
        passwordHash: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, user[0].id));

    // Mark reset token as used
    await db
      .update(passwordResets)
      .set({ used: true })
      .where(eq(passwordResets.id, resetRequest[0].id));

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
}

// Get all users (admin only)
export async function getAllUsers(req: Request, res: Response) {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    res.json(allUsers);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
}

// Update user (admin only)
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow password updates through this endpoint
    delete updates.password;
    delete updates.passwordHash;

    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
      });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
}

// Note: Admin signup code functions moved to ultra-simple-admin.ts for simplicity
