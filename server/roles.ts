import type { Request, Response, NextFunction } from "express";

// Define all available user roles
export const USER_ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  PRINTER_MANAGER: 'printer_manager',
  PRESIDENT: 'president',
  CAPTAIN: 'captain',
  RECIPIENT_COORDINATOR: 'recipient_coordinator',
  OUTREACH_COORDINATOR: 'outreach_coordinator',
  MARKETING_COORDINATOR: 'marketing_coordinator',
  ART_COORDINATOR: 'art_coordinator',
  MEMBER: 'member'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Define role hierarchy (higher numbers = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [USER_ROLES.MEMBER]: 1,
  [USER_ROLES.ART_COORDINATOR]: 2,
  [USER_ROLES.MARKETING_COORDINATOR]: 2,
  [USER_ROLES.OUTREACH_COORDINATOR]: 2,
  [USER_ROLES.RECIPIENT_COORDINATOR]: 2,
  [USER_ROLES.PRINTER_MANAGER]: 3,
  [USER_ROLES.CAPTAIN]: 4,
  [USER_ROLES.PROJECT_MANAGER]: 4,
  [USER_ROLES.PRESIDENT]: 5,
  [USER_ROLES.ADMIN]: 6
};

// Define permission type
type Permission = 
  | 'view_own_profile'
  | 'update_own_profile'
  | 'view_teams'
  | 'view_events'
  | 'submit_applications'
  | 'submit_event_attendance'
  | 'view_own_applications'
  | 'manage_print_submissions'
  | 'view_print_queue'
  | 'manage_marketing_requests'
  | 'view_marketing_submissions'
  | 'manage_outreach_events'
  | 'view_outreach_data'
  | 'manage_recipients'
  | 'view_recipient_data'
  | 'view_member_data'
  | 'manage_team_assignments'
  | 'manage_special_roles'
  | 'view_team_metrics'
  | 'manage_teams'
  | 'view_application_data'
  | 'manage_applications'
  | 'manage_projects'
  | 'view_project_data'
  | 'manage_users'
  | 'manage_roles'
  | 'view_all_data'
  | 'manage_all_settings'
  | 'manage_art_requests'
  | 'view_art_submissions'
  | 'view_all_print_requests'
  | 'approve_print_requests'
  | 'manage_printer_settings'
  | 'view_all_applications'
  | 'assign_team_members'
  | 'view_project_reports'
  | 'full_access'
  | 'system_administration'
  | 'manage_all_teams'
  | 'view_all_reports'
  | 'approve_role_applications'
  | 'manage_organization_settings';

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [USER_ROLES.MEMBER]: [
    'view_own_profile',
    'update_own_profile',
    'view_teams',
    'view_events',
    'submit_applications',
    'submit_event_attendance',
    'view_own_applications'
  ],
  [USER_ROLES.ART_COORDINATOR]: [
    'view_own_profile',
    'update_own_profile',
    'view_teams',
    'view_events',
    'submit_applications',
    'submit_event_attendance',
    'view_own_applications',
    'manage_art_requests',
    'view_art_submissions'
  ],
  [USER_ROLES.MARKETING_COORDINATOR]: [
    'view_own_profile',
    'update_own_profile',
    'view_teams',
    'view_events',
    'submit_applications',
    'submit_event_attendance',
    'view_own_applications',
    'manage_marketing_requests',
    'view_marketing_submissions'
  ],
  [USER_ROLES.OUTREACH_COORDINATOR]: [
    'view_own_profile',
    'update_own_profile',
    'view_teams',
    'view_events',
    'submit_applications',
    'submit_event_attendance',
    'view_own_applications',
    'manage_outreach_events',
    'view_outreach_data'
  ],
  [USER_ROLES.RECIPIENT_COORDINATOR]: [
    'view_own_profile',
    'update_own_profile',
    'view_teams',
    'view_events',
    'submit_applications',
    'submit_event_attendance',
    'view_own_applications',
    'manage_recipients',
    'view_recipient_data'
  ],
  [USER_ROLES.PRINTER_MANAGER]: [
    'view_own_profile',
    'update_own_profile',
    'view_teams',
    'view_events',
    'submit_applications',
    'submit_event_attendance',
    'view_own_applications',
    'manage_print_submissions',
    'view_all_print_requests',
    'approve_print_requests',
    'manage_printer_settings'
  ],
  [USER_ROLES.PROJECT_MANAGER]: [
    'view_own_profile',
    'update_own_profile',
    'view_teams',
    'view_events',
    'submit_applications',
    'submit_event_attendance',
    'view_own_applications',
    'manage_projects',
    'view_all_applications',
    'assign_team_members',
    'manage_team_assignments',
    'view_project_reports'
  ],
  [USER_ROLES.CAPTAIN]: [
    'full_access',
    'manage_users',
    'manage_roles',
    'system_administration',
    'view_all_data',
    'manage_all_settings'
  ],
  [USER_ROLES.PRESIDENT]: [
    'view_own_profile',
    'update_own_profile',
    'view_teams',
    'view_events',
    'submit_applications',
    'submit_event_attendance',
    'view_own_applications',
    'manage_all_teams',
    'view_all_applications',
    'assign_team_members',
    'manage_team_assignments',
    'view_all_reports',
    'manage_special_roles',
    'approve_role_applications',
    'manage_organization_settings'
  ],
  [USER_ROLES.ADMIN]: [
    'full_access',
    'manage_users',
    'manage_roles',
    'system_administration',
    'view_all_data',
    'manage_all_settings'
  ]
} as const;

// Permission checking functions
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  // Admin has full access
  if (userRole === USER_ROLES.ADMIN) {
    return true;
  }
  
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions.includes(permission);
}

export function hasRoleLevel(userRole: UserRole, requiredLevel: number): boolean {
  return ROLE_HIERARCHY[userRole] >= requiredLevel;
}

export function hasAnyRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

// Middleware functions for role-based access control
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (!hasAnyRole(user.role, allowedRoles)) {
      return res.status(403).json({ 
        message: "Insufficient permissions",
        required: allowedRoles,
        current: user.role
      });
    }
    
    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (!hasPermission(user.role, permission)) {
      return res.status(403).json({ 
        message: "Insufficient permissions",
        required: permission,
        current: user.role
      });
    }
    
    next();
  };
}

export function requireMinimumRole(minimumRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const requiredLevel = ROLE_HIERARCHY[minimumRole];
    if (!hasRoleLevel(user.role, requiredLevel)) {
      return res.status(403).json({ 
        message: "Insufficient role level",
        required: minimumRole,
        current: user.role
      });
    }
    
    next();
  };
}

// Helper function to get user's permissions
export function getUserPermissions(userRole: UserRole): readonly string[] {
  if (userRole === USER_ROLES.ADMIN) {
    return ['full_access'];
  }
  
  return ROLE_PERMISSIONS[userRole];
}

// Helper function to get all available roles for display
export function getAllRoles(): { value: UserRole; label: string; level: number }[] {
  return Object.values(USER_ROLES).map(role => ({
    value: role,
    label: role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    level: ROLE_HIERARCHY[role]
  })).sort((a, b) => b.level - a.level);
}
