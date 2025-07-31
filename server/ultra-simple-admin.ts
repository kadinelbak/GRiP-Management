import { Request, Response } from 'express';
import crypto from 'crypto';

// In-memory storage for the admin code (simple approach)
let currentAdminCode: {
  code: string;
  expiresAt: Date;
  createdAt: Date;
} | null = null;

// Generate a new admin signup code (no auth required - since admin page is protected)
export function generateSimpleAdminCode(req: Request, res: Response) {
  try {
    // Generate new 8-character code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const createdAt = new Date();

    // Store in memory
    currentAdminCode = {
      code,
      expiresAt,
      createdAt
    };

    console.log('Generated new admin code:', code);

    res.json({ 
      code: currentAdminCode.code,
      expiresAt: currentAdminCode.expiresAt,
      message: 'New admin signup code generated'
    });
  } catch (error) {
    console.error('Generate admin code error:', error);
    res.status(500).json({ message: 'Failed to generate admin code' });
  }
}

// Get current admin signup code (no auth required - since admin page is protected)
export function getCurrentSimpleAdminCode(req: Request, res: Response) {
  try {
    // Check if code exists and is not expired
    if (!currentAdminCode || new Date() > currentAdminCode.expiresAt) {
      return res.json({ 
        code: null, 
        message: 'No active admin signup code. Generate a new one.' 
      });
    }

    res.json({
      code: currentAdminCode.code,
      expiresAt: currentAdminCode.expiresAt,
      createdAt: currentAdminCode.createdAt
    });
  } catch (error) {
    console.error('Get admin code error:', error);
    res.status(500).json({ message: 'Failed to get admin code' });
  }
}

// Verify admin signup code for new user registration
export function verifySimpleAdminCode(code: string): boolean {
  if (!currentAdminCode) {
    return false;
  }

  // Check if code matches and is not expired
  return currentAdminCode.code === code && new Date() <= currentAdminCode.expiresAt;
}
