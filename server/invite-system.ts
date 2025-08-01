import { db } from "./db.js";
import { inviteCodes, type InviteCode } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export class InviteSystem {
  async createInviteCode(
    createdBy: string,
    role: string,
    maxUses: number = 1,
    expiresAt: Date | null = null
  ): Promise<string> {
    const code = crypto.randomBytes(16).toString('hex');
    
    await db.insert(inviteCodes).values({
      code,
      role,
      maxUses,
      currentUses: 0,
      expiresAt,
      createdBy,
      isActive: true
    });
    
    return code;
  }

  async validateInviteCode(code: string): Promise<InviteCode | null> {
    const inviteCode = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, code))
      .limit(1);

    if (!inviteCode.length) {
      return null;
    }

    const invite = inviteCode[0];

    // Check if code is still active
    if (!invite.isActive) {
      return null;
    }

    // Check if code has expired
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return null;
    }

    // Check if code has reached max uses
    if (invite.currentUses >= invite.maxUses) {
      return null;
    }

    return invite;
  }

  async useInviteCode(code: string): Promise<boolean> {
    const invite = await this.validateInviteCode(code);
    
    if (!invite) {
      return false;
    }

    // Increment current uses
    await db
      .update(inviteCodes)
      .set({ 
        currentUses: invite.currentUses + 1,
        isActive: invite.currentUses + 1 < invite.maxUses
      })
      .where(eq(inviteCodes.code, code));

    return true;
  }

  async getInviteCodes(createdBy?: string): Promise<InviteCode[]> {
    if (createdBy) {
      return await db
        .select()
        .from(inviteCodes)
        .where(eq(inviteCodes.createdBy, createdBy));
    }

    return await db.select().from(inviteCodes);
  }

  async deactivateInviteCode(code: string): Promise<boolean> {
    const result = await db
      .update(inviteCodes)
      .set({ isActive: false })
      .where(eq(inviteCodes.code, code));

    return (result.rowCount ?? 0) > 0;
  }
}

export const inviteSystem = new InviteSystem();