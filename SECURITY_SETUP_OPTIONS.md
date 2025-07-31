# Security Setup Options for GRiP Management

You're getting a 403 "Session expired or invalid" error. Here are several security approaches to fix this:

## Option 1: Environment Variable Setup (Most Secure - Recommended)

### Step 1: Add environment variables to your `.env` file:
```env
INITIAL_ADMIN_EMAIL=your-email@example.com
INITIAL_ADMIN_PASSWORD=your-secure-password
INITIAL_ADMIN_FIRST_NAME=Your
INITIAL_ADMIN_LAST_NAME=Name
```

### Step 2: Update server/index.ts to call setup on startup:
```typescript
import { setupInitialAdmin } from './setup-admin.js';

// Add this after database connection
await setupInitialAdmin();
```

This creates an initial admin automatically when the server starts.

## Option 2: Command Line Admin Creation

Use the existing script:
```bash
npm run create-admin
```

This will prompt you for admin details and create the account directly.

## Option 3: Database Direct Insert

Connect to your database directly and run:
```sql
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) 
VALUES ('admin@grip.com', '$2a$12$hashed_password_here', 'Admin', 'User', 'admin', true);
```

## Option 4: Invite Link System (Better UX)

Instead of codes, use secure invite links:
- Admin generates invite link for specific email
- Link expires after 24 hours
- More secure and user-friendly

## Option 5: Fix Current Authentication Issue

The 403 error might be due to:

1. **Expired JWT Token**: Try logging out and back in
2. **Missing Token**: Check if localStorage has 'auth_token'
3. **User Not Active**: Check database if user.is_active = true

### Quick Debug Steps:
1. Open browser DevTools → Application → Local Storage
2. Check if 'auth_token' exists
3. Try clearing localStorage and logging in again
4. Check browser network tab for the actual error response

## Option 6: Temporary Admin Bypass

For immediate access, you can temporarily disable admin check:

In `server/routes.ts`, comment out `requireAdmin` middleware:
```typescript
// Temporarily disable admin requirement
app.get("/api/auth/admin-code/current", authenticateToken, /* requireAdmin, */ getCurrentAdminCode);
app.post("/api/auth/admin-code/generate", authenticateToken, /* requireAdmin, */ generateAdminCode);
```

**Remember to re-enable it after creating your admin account!**

## Recommended Approach:

1. Use Option 1 (Environment Variables) for initial setup
2. Switch to Option 4 (Invite Links) for ongoing admin management
3. This provides the best security and user experience

Would you like me to implement any of these options?
