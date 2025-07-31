import { Request, Response } from 'express';
import { db } from './db.js';
import { adminInvites, users } from '../shared/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';

// Generate invite link (admin only)
export async function generateInviteLink(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { email, expiresInHours = 24 } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Deactivate any existing invites for this email
    await db
      .update(adminInvites)
      .set({ isActive: false })
      .where(and(
        eq(adminInvites.email, email),
        eq(adminInvites.isActive, true)
      ));

    // Create new invite
    const [invite] = await db
      .insert(adminInvites)
      .values({
        token,
        email,
        expiresAt,
        createdBy: userId,
      })
      .returning();

    const inviteUrl = `${process.env.APP_URL || 'http://localhost:3000'}/signup?invite=${token}`;

    res.json({
      inviteUrl,
      email,
      expiresAt: invite.expiresAt,
      message: 'Invite link generated successfully'
    });
  } catch (error) {
    console.error('Generate invite error:', error);
    res.status(500).json({ message: 'Failed to generate invite link' });
  }
}

// Verify invite token
export async function verifyInviteToken(req: Request, res: Response) {
  try {
    const { token } = req.params;

    const invite = await db
      .select()
      .from(adminInvites)
      .where(and(
        eq(adminInvites.token, token),
        eq(adminInvites.isActive, true),
        gt(adminInvites.expiresAt, new Date())
      ))
      .limit(1);

    if (invite.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired invite link' });
    }

    res.json({
      email: invite[0].email,
      valid: true
    });
  } catch (error) {
    console.error('Verify invite error:', error);
    res.status(500).json({ message: 'Failed to verify invite' });
  }
}

// Signup with invite token
export async function signupWithInvite(req: Request, res: Response) {
  try {
    const { token, password, firstName, lastName } = req.body;

    // Verify invite
    const invite = await db
      .select()
      .from(adminInvites)
      .where(and(
        eq(adminInvites.token, token),
        eq(adminInvites.isActive, true),
        gt(adminInvites.expiresAt, new Date())
      ))
      .limit(1);

    if (invite.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired invite link' });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, invite[0].email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    
    const [newUser] = await db
      .insert(users)
      .values({
        email: invite[0].email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: 'admin',
        isActive: true,
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      });

    // Deactivate the invite
    await db
      .update(adminInvites)
      .set({ isActive: false, usedAt: new Date() })
      .where(eq(adminInvites.id, invite[0].id));

    res.status(201).json({
      message: 'Admin account created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Signup with invite error:', error);
    res.status(500).json({ message: 'Failed to create account' });
  }
}
