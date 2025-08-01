import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { 
  insertTeamSchema, insertApplicationSchema, insertAdditionalTeamSignupSchema, 
  insertProjectRequestSchema, insertAdminSettingSchema, insertAbsenceSchema,
  insertEventSchema, insertEventAttendanceSchema, insertPrintSubmissionSchema,
  insertSpecialRoleSchema, insertRoleApplicationSchema, insertMarketingRequestSchema
} from "../shared/schema.js";
import { z } from "zod";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { applications, teams, projectRequests, events, eventAttendance, printSubmissions, absences, specialRoles, roleApplications, memberRoles, marketingRequests, additionalTeamSignups } from "./db";
import { eq, and, isNull, sql, gt } from "drizzle-orm";
import crypto from "crypto";
import { db } from "./db";
import { authenticateToken, requireAdmin, requireAuth } from "./auth.js";
import { 
  register, login, logout, getCurrentUser, changePassword, 
  requestPasswordReset, resetPassword, getAllUsers, updateUser,
  signup
} from "./auth-routes.js";
import { generateSimpleAdminCode, getCurrentSimpleAdminCode } from "./ultra-simple-admin.js";
import { 
  USER_ROLES, getAllRoles, requireRole, requirePermission, requireMinimumRole,
  getUserPermissions, hasPermission, type UserRole 
} from "./roles.js";

interface AssignmentResult {
  applicationId: string;
  assignedTeamId: string | null;
  status: 'assigned' | 'waitlisted';
  reasoning: string;
  preferenceRank?: number;
}

interface TeamAssignmentReport {
  assignments: AssignmentResult[];
  summary: {
    totalApplications: number;
    assigned: number;
    waitlisted: number;
    timestamp: string;
  };
}

function performTeamAssignment(applications: any[], teams: any[]): TeamAssignmentReport {
  const assignments: AssignmentResult[] = [];
  const teamCapacities = new Map(teams.map(team => [team.id, { current: 0, max: team.maxCapacity }]));

  // Sort applications by timestamp (first-come, first-served priority)
  const sortedApplications = [...applications].sort((a, b) => 
    new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );

  for (const application of sortedApplications) {
    let assigned = false;
    let reasoning = `Application submitted at ${new Date(application.submittedAt).toLocaleString()}. `;

    // Try each team preference in order
    for (let i = 0; i < application.teamPreferences.length; i++) {
      const teamId = application.teamPreferences[i];
      const team = teams.find(t => t.id === teamId);
      const capacity = teamCapacities.get(teamId);

      if (!team || !capacity) {
        reasoning += `Team preference ${i + 1} (${teamId}) not found. `;
        continue;
      }

      if (capacity.current < capacity.max) {
        // Assign to this team
        capacity.current++;
        assignments.push({
          applicationId: application.id,
          assignedTeamId: teamId,
          status: 'assigned',
          reasoning: reasoning + `Assigned to team "${team.name}" (preference #${i + 1}). Team capacity: ${capacity.current}/${capacity.max}.`,
          preferenceRank: i + 1
        });
        assigned = true;
        break;
      } else {
        reasoning += `Team preference ${i + 1} "${team.name}" is at full capacity (${capacity.max}/${capacity.max}). `;
      }
    }

    if (!assigned) {
      assignments.push({
        applicationId: application.id,
        assignedTeamId: null,
        status: 'waitlisted',
        reasoning: reasoning + "All preferred teams are at capacity. Added to waitlist.",
        preferenceRank: undefined
      });
    }
  }

  return {
    assignments,
    summary: {
      totalApplications: applications.length,
      assigned: assignments.filter(a => a.status === 'assigned').length,
      waitlisted: assignments.filter(a => a.status === 'waitlisted').length,
      timestamp: new Date().toISOString()
    }
  };
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'print-submissions');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  fileFilter: (req, file, cb) => {
    // Accept only ZIP and STL files
    const allowedTypes = ['.zip', '.stl'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP and STL files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoints for deployments
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", message: "Server is running", timestamp: new Date().toISOString() });
  });

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", message: "Server is running" });
  });

  // Authentication Routes
  app.post("/api/auth/register", authenticateToken, requireAdmin, register);
  app.post("/api/auth/signup", signup); // Public signup with admin code
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", authenticateToken, getCurrentUser);
  app.post("/api/auth/change-password", authenticateToken, changePassword);
  app.post("/api/auth/request-password-reset", requestPasswordReset);
  app.post("/api/auth/reset-password", resetPassword);
  app.get("/api/auth/users", authenticateToken, requireMinimumRole(USER_ROLES.PROJECT_MANAGER), getAllUsers);
  app.put("/api/auth/users/:id", authenticateToken, requireMinimumRole(USER_ROLES.PROJECT_MANAGER), updateUser);
  
  // Ultra-simple admin signup code management (no auth - admin page handles protection)
  app.post("/api/auth/admin-code/generate", generateSimpleAdminCode);
  app.get("/api/auth/admin-code/current", getCurrentSimpleAdminCode);
  
  // Test endpoint
  app.get("/api/test/ultra-simple", (req, res) => {
    res.json({ message: "Ultra-simple admin routes are active", timestamp: new Date().toISOString() });
  });

  // Role Management API
  app.get("/api/roles", (req, res) => {
    try {
      const roles = getAllRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.get("/api/auth/user-permissions", authenticateToken, (req, res) => {
    try {
      const user = (req as any).user;
      const permissions = getUserPermissions(user.role);
      res.json({ 
        role: user.role,
        permissions: Array.from(permissions),
        hasFullAccess: user.role === USER_ROLES.ADMIN
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user permissions" });
    }
  });

  // Update user role (admin only)
  app.put("/api/auth/users/:id/role", authenticateToken, requireRole(USER_ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Validate role
      if (!Object.values(USER_ROLES).includes(role)) {
        return res.status(400).json({ message: "Invalid role specified" });
      }

      const updatedUser = await storage.updateUserRole(id, role);
      res.json({ 
        message: "User role updated successfully",
        user: updatedUser 
      });
    } catch (error) {
      console.error("Failed to update user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Apply authentication middleware to all admin routes
  app.use("/api/admin/*", authenticateToken, requireRole(USER_ROLES.ADMIN, USER_ROLES.PRESIDENT, USER_ROLES.PROJECT_MANAGER));

  // Teams API
  app.get("/api/teams", async (_req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/type/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const teams = await storage.getTeamsByType(type);
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams by type" });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid team data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create team" });
      }
    }
  });

  app.put("/api/teams/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const team = await storage.updateTeam(id, updates);
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  app.delete("/api/teams/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTeam(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Applications API
  app.get("/api/applications", async (_req, res) => {
    try {
      const applications = await storage.getApplications();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post("/api/applications", async (req, res) => {
    try {
      // Check email domain
      const allowedDomains = await storage.getAdminSetting("allowed_email_domains");
      const domains = allowedDomains ? JSON.parse(allowedDomains.value) : ["@ufl.edu"];

      const emailDomain = req.body.email?.split("@")[1];
      const isValidDomain = domains.some((domain: string) => 
        domain.startsWith("@") ? emailDomain === domain.substring(1) : emailDomain === domain
      );

      if (!isValidDomain) {
        return res.status(400).json({ 
          message: "Invalid email domain. Please use an approved email address." 
        });
      }

      // Check for duplicate email or UFID
      const existingApplications = await storage.getApplications();

      const isDuplicate = existingApplications.some((app: any) => 
        app.email.toLowerCase() === req.body.email.toLowerCase() || 
        app.ufid === req.body.ufid
      );

      if (isDuplicate) {
        return res.status(400).json({ 
          message: "An application with this email address or UFID already exists." 
        });
      }

      const applicationData = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid application data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to submit application" });
      }
    }
  });

  app.delete("/api/applications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteApplication(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  app.put("/api/applications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const application = await storage.updateApplication(id, updates);
      res.json(application);
    } catch (error) {
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Get accepted members
  app.get("/api/accepted-members", async (_req, res) => {
    try {
      const members = await storage.getAcceptedMembers();
      // Map assignedTeamId to teamId for frontend compatibility
      const mappedMembers = members.map(member => ({
        ...member,
        teamId: member.assignedTeamId
      }));
      res.json(mappedMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accepted members" });
    }
  });

  // Update member team assignment
  app.put("/api/accepted-members/:id/team", async (req, res) => {
    try {
      const { id } = req.params;
      const { teamId } = req.body;
      
      await storage.updateApplication(id, { assignedTeamId: teamId });
      res.json({ success: true, message: "Team assignment updated successfully" });
    } catch (error) {
      console.error("Failed to update team assignment:", error);
      res.status(500).json({ message: "Failed to update team assignment" });
    }
  });

  // Remove member (delete accepted member)
  app.delete("/api/accepted-members/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.deleteApplication(id);
      res.json({ success: true, message: "Member removed successfully" });
    } catch (error) {
      console.error("Failed to remove member:", error);
      res.status(500).json({ message: "Failed to remove member" });
    }
  });

  // CSV exports
  app.get("/api/export/members", async (_req, res) => {
    try {
      const members = await storage.getAcceptedMembers();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="members.csv"');

      const headers = ['Name', 'Email', 'UFID', 'Team', 'Skills', 'Submitted At'];
      const csvData = [headers.join(',')];

      members.forEach(member => {
        const row = [
          `"${member.fullName}"`,
          `"${member.email}"`,
          `"${member.ufid}"`,
          `"${member.assignedTeamId || 'N/A'}"`,
          `"${Array.isArray(member.skills) ? member.skills.join('; ') : ''}"`,
          `"${new Date(member.submittedAt).toLocaleDateString()}"`
        ];
        csvData.push(row.join(','));
      });

      res.send(csvData.join('\n'));
    } catch (error) {
      res.status(500).json({ message: "Failed to export members CSV" });
    }
  });

  app.get("/api/export/applications", async (_req, res) => {
    try {
      const applications = await storage.getApplications();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="applications.csv"');

      const headers = ['Name', 'Email', 'UFID', 'Status', 'Team Preferences', 'Skills', 'Submitted At'];
      const csvData = [headers.join(',')];

      applications.forEach(app => {
        const row = [
          `"${app.fullName}"`,
          `"${app.email}"`,
          `"${app.ufid}"`,
          `"${app.status}"`,
          `"${Array.isArray(app.teamPreferences) ? app.teamPreferences.join('; ') : ''}"`,
          `"${Array.isArray(app.skills) ? app.skills.join('; ') : ''}"`,
          `"${new Date(app.submittedAt).toLocaleDateString()}"`
        ];
        csvData.push(row.join(','));
      });

      res.send(csvData.join('\n'));
    } catch (error) {
      res.status(500).json({ message: "Failed to export applications CSV" });
    }
  });

  app.post("/api/applications/assign-teams", async (_req, res) => {
    try {
      const result = await storage.assignTeamsAutomatically();
      res.json({ message: "Teams assigned successfully", assignments: result.assignments });
    } catch (error) {
      res.status(500).json({ message: "Failed to assign teams" });
    }
  });

  // Get team members
  app.get("/api/teams/:id/members", async (req, res) => {
    try {
      const { id } = req.params;
      const members = await storage.getTeamMembers(id);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Remove user from team
  app.delete("/api/teams/members/:applicationId", async (req, res) => {
    try {
      const { applicationId } = req.params;
      await storage.removeUserFromTeam(applicationId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove user from team" });
    }
  });

  // Remove all members from all teams
  app.delete("/api/admin/remove-all-members", async (_req, res) => {
    try {
      await storage.removeAllMembers();
      res.json({ message: "All members removed from teams successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove all members" });
    }
  });

  // CSV Export
  app.get("/api/applications/export", async (_req, res) => {
    try {
      const applications = await storage.getApplications();
      const teams = await storage.getTeams();
      const teamMap = new Map(teams.map(t => [t.id, t.name]));

      const csvHeader = "Name,Email,UFID,Team Preferences,Assigned Team,Status,Skills,Time Availability,Assignment Reason,Submitted At\n";
      const csvRows = applications.map(app => {
        const teamPreferences = Array.isArray(app.teamPreferences) 
          ? app.teamPreferences.map(id => teamMap.get(id) || "Unknown").join("; ") 
          : "None";
        const assignedTeam = app.assignedTeamId ? teamMap.get(app.assignedTeamId) || "Unknown" : "None";
        const skills = Array.isArray(app.skills) ? app.skills.join("; ") : "";
        const timeAvailability = Array.isArray(app.timeAvailability) 
          ? app.timeAvailability.map(slot => `${slot.day}: ${slot.startTime}-${slot.endTime}`).join("; ")
          : "";

        return [
          `"${app.fullName}"`,
          `"${app.email}"`,
          `"${app.ufid}"`,
          `"${teamPreferences}"`,
          `"${assignedTeam}"`,
          `"${app.status}"`,
          `"${skills}"`,
          `"${timeAvailability}"`,
          `"${app.assignmentReason || ""}"`,
          `"${app.submittedAt}"`
        ].join(",");
      }).join("\n");

      const csv = csvHeader + csvRows;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=grip-applications.csv");
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: "Failed to export applications" });
    }
  });

  // Auto-assign teams endpoint
  app.post("/api/admin/assign-teams", async (req, res) => {
    try {
      // Use the storage service method instead of direct db access
      const result = await storage.assignTeamsAutomatically();

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `grip-team-assignment-log-${timestamp}.txt`;

      res.json({ 
        success: true, 
        assignments: result.assignments,
        logFileContent: result.logFileContent,
        logFileName: filename,
        message: `Assignment completed successfully`
      });

    } catch (error) {
      console.error("Assignment error:", error);
      res.status(500).json({ error: "Failed to assign teams" });
    }
  });

  // Auto-sort existing members endpoint
  app.post("/api/admin/auto-sort-members", async (req, res) => {
    try {
      // Get all assigned members without teams
      const unassignedMembers = await db
        .select()
        .from(applications)
        .where(and(
          eq(applications.status, 'assigned'),
          isNull(applications.assignedTeamId)
        ));

      // Get all teams with available space
      const allTeams = await db.select().from(teams);
      const availableTeams = [];

      for (const team of allTeams) {
        const currentMemberCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(applications)
          .where(and(
            eq(applications.assignedTeamId, team.id),
            eq(applications.status, 'assigned')
          ));

        const memberCount = Number(currentMemberCount[0]?.count || 0);
        if (memberCount < team.maxCapacity) {
          availableTeams.push({
            ...team,
            availableSpots: team.maxCapacity - memberCount
          });
        }
      }

      if (unassignedMembers.length === 0) {
        return res.json({ 
          success: true, 
          message: "No unassigned members found",
          assignedCount: 0
        });
      }

      if (availableTeams.length === 0) {
        return res.json({ 
          success: false, 
          message: "No teams have available spots",
          assignedCount: 0
        });
      }

      // Sort teams by available spots (most space first)
      availableTeams.sort((a, b) => b.availableSpots - a.availableSpots);

      // Distribute members evenly across teams
      let assignedCount = 0;
      let currentTeamIndex = 0;

      for (const member of unassignedMembers) {
        if (availableTeams[currentTeamIndex].availableSpots > 0) {
          await db
            .update(applications)
            .set({ assignedTeamId: availableTeams[currentTeamIndex].id })
            .where(eq(applications.id, member.id));

          availableTeams[currentTeamIndex].availableSpots--;
          assignedCount++;

          // Move to next team for even distribution
          currentTeamIndex = (currentTeamIndex + 1) % availableTeams.length;

          // Remove teams with no more space
          while (availableTeams.length > 0 && availableTeams[currentTeamIndex].availableSpots === 0) {
            availableTeams.splice(currentTeamIndex, 1);
            if (availableTeams.length === 0) break;
            if (currentTeamIndex >= availableTeams.length) {
              currentTeamIndex = 0;
            }
          }

          if (availableTeams.length === 0) break;
        }
      }

      res.json({ 
        success: true, 
        message: `Successfully assigned ${assignedCount} members to teams`,
        assignedCount
      });

    } catch (error) {
      console.error("Auto-sort error:", error);
      res.status(500).json({ error: "Failed to auto-sort members" });
    }
  });

  app.get("/api/admin/download-assignment-log", async (req, res) => {
    try {
      const { content, filename } = req.query;

      if (!content || !filename) {
        return res.status(400).json({ error: "Missing content or filename" });
      }

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(decodeURIComponent(content as string));
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Failed to download log file" });
    }
  });

  app.get("/api/admin/assignment-report", async (_req, res) => {
    try {
      const applications = await storage.getApplications();
      const teams = await storage.getTeams();
      const technicalTeams = teams.filter(team => team.type === 'technical');

      const report = performTeamAssignment(applications, technicalTeams);
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate assignment report" });
    }
  });

  // Additional Team Signups API
  app.get("/api/additional-signups", async (_req, res) => {
    try {
      const signups = await storage.getAdditionalTeamSignups();
      res.json(signups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch additional team signups" });
    }
  });

  app.post("/api/additional-signups", async (req, res) => {
    try {
      const signupData = insertAdditionalTeamSignupSchema.parse(req.body);
      const signup = await storage.createAdditionalTeamSignup(signupData);
      res.status(201).json(signup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid signup data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to submit signup" });
      }
    }
  });

  // Project Requests API
  app.get("/api/project-requests", async (_req, res) => {
    try {
      const requests = await storage.getProjectRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project requests" });
    }
  });

  app.post("/api/project-requests", async (req, res) => {
    try {
      const requestData = insertProjectRequestSchema.parse(req.body);
      const request = await storage.createProjectRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid project request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to submit project request" });
      }
    }
  });

  app.put("/api/project-requests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const request = await storage.updateProjectRequest(id, updates);
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project request" });
    }
  });

  app.delete("/api/project-requests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProjectRequest(id);
      res.json({ message: "Project request deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project request" });
    }
  });

  app.post("/api/admin/convert-project-to-team", async (req, res) => {
    try {
      const { projectId, teamData } = req.body;

      // Create the team
      const teamDataWithValidation = insertTeamSchema.parse(teamData);
      const team = await storage.createTeam(teamDataWithValidation);

      // Update project status to indicate it was converted
      await storage.updateProjectRequest(projectId, { 
        status: "approved"
      });

      res.json({ team, message: "Project successfully converted to team" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid team data", errors: error.errors });
      } else {
        console.error("Failed to convert project to team:", error);
        res.status(500).json({ message: "Failed to convert project to team" });
      }
    }
  });

  // Admin Settings API
  app.get("/api/admin/settings", async (_req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  app.post("/api/admin/settings", async (req, res) => {
    try {
      const settingData = insertAdminSettingSchema.parse(req.body);
      const setting = await storage.setAdminSetting(settingData);
      res.json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid setting data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save setting" });
      }
    }
  });

  // Admin Dashboard Stats
  app.get("/api/admin/stats", async (_req, res) => {
    try {
      // Get real data from database
      const allApplications = await db.select().from(applications);
      const allTeams = await db.select().from(teams);
      const allProjectRequests = await db.select().from(projectRequests);
      const allAdditionalSignups = await db.select().from(additionalTeamSignups);

      // Calculate accurate stats - use 'assigned' status to match what Members section shows
      const assignedApplications = allApplications.filter(app => app.status === 'assigned');
      const membersWithTeams = assignedApplications.filter(app => app.assignedTeamId);
      const waitlistedApplications = allApplications.filter(app => app.status === 'waitlisted');

      // Calculate filled teams (teams at or near capacity) - use assigned applications
      const filledTeamsCount = allTeams.filter(team => {
        const teamMemberCount = assignedApplications.filter(app => app.assignedTeamId === team.id).length;
        return teamMemberCount >= team.maxCapacity;
      }).length;

      const stats = {
        totalApplications: allApplications.length,
        assignedApplications: membersWithTeams.length,
        waitlistedApplications: waitlistedApplications.length,
        totalTeams: allTeams.length,
        filledTeams: filledTeamsCount,
        totalProjectRequests: allProjectRequests.length,
        totalAdditionalSignups: allAdditionalSignups.length,
      };

      res.json(stats);
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Recent Activity API
  app.get("/api/admin/recent-activity", async (_req, res) => {
    try {
      interface Activity {
        type: string;
        message: string;
        description: string;
        timestamp: Date;
        color: string;
      }

      const activities: Activity[] = [];

      // Get recent applications (last 24 hours)
      const recentApplications = await db
        .select({
          id: applications.id,
          fullName: applications.fullName,
          submittedAt: applications.submittedAt,
          teamPreferences: applications.teamPreferences,
        })
        .from(applications)
        .where(gt(applications.submittedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))
        .orderBy(applications.submittedAt)
        .limit(5);

      // Get recent project requests (last 7 days)
      const recentProjects = await db
        .select({
          id: projectRequests.id,
          projectTitle: projectRequests.projectTitle,
          submittedAt: projectRequests.submittedAt,
        })
        .from(projectRequests)
        .where(gt(projectRequests.submittedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
        .orderBy(projectRequests.submittedAt)
        .limit(3);

      // Get teams data for team-related activities
      const teamsData = await db.select().from(teams);

      // Format activities
      recentApplications.forEach(app => {
        const preferences = app.teamPreferences as string[];
        const firstPreference = preferences?.[0];
        const team = teamsData.find(t => t.id === firstPreference);
        activities.push({
          type: 'application',
          message: 'New application received',
          description: `${app.fullName} applied for ${team?.name || 'a team'}`,
          timestamp: app.submittedAt,
          color: 'green'
        });
      });

      recentProjects.forEach(project => {
        activities.push({
          type: 'project',
          message: 'Project request submitted',
          description: `${project.projectTitle}`,
          timestamp: project.submittedAt,
          color: 'purple'
        });
      });

      // Sort by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Add some system activities if we don't have enough real activities
      if (activities.length < 3) {
        const systemActivities: Activity[] = [
          {
            type: 'system',
            message: 'System status check',
            description: 'All systems operational',
            timestamp: new Date(),
            color: 'blue'
          }
        ];
        activities.push(...systemActivities);
      }

      res.json(activities.slice(0, 5)); // Return max 5 activities
    } catch (error) {
      console.error('Recent activity error:', error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Absences API
  app.get("/api/absences", async (_req, res) => {
    try {
      const absences = await storage.getAbsences();
      res.json(absences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch absences" });
    }
  });

  app.post("/api/absences", async (req, res) => {
    try {
      const absenceData = insertAbsenceSchema.parse(req.body);
      const absence = await storage.createAbsence(absenceData);
      res.status(201).json(absence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid absence data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create absence" });
      }
    }
  });

  app.get("/api/absences/user/:applicationId", async (req, res) => {
    try {
      const { applicationId } = req.params;
      const absences = await storage.getAbsencesByApplication(applicationId);
      res.json(absences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user absences" });
    }
  });

  app.delete("/api/absences/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.clearAbsence(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to clear absence" });
    }
  });

  app.delete("/api/absences/user/:applicationId", async (req, res) => {
    try {
      const { applicationId } = req.params;
      await storage.clearAllAbsencesForUser(applicationId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to clear user absences" });
    }
  });

  // Events API
  app.get("/api/events", async (_req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      // Convert eventDate string to Date object
      const processedData = {
        ...eventData,
        eventDate: new Date(eventData.eventDate)
      };
      const event = await storage.createEvent(processedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid event data", errors: error.errors });
      } else {
        console.error("Event creation error:", error);
        res.status(500).json({ message: "Failed to create event" });
      }
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const event = await storage.updateEvent(id, updates);
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEvent(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Event Attendance API
  app.get("/api/event-attendance", async (_req, res) => {
    try {
      const attendance = await storage.getEventAttendance();
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event attendance" });
    }
  });

  app.post("/api/event-attendance", async (req, res) => {
    try {
      const attendanceData = insertEventAttendanceSchema.parse(req.body);
      const attendance = await storage.createEventAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to submit attendance" });
      }
    }
  });

  app.put("/api/event-attendance/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await storage.approveEventAttendance(id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve attendance" });
    }
  });

  app.put("/api/event-attendance/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.rejectEventAttendance(id);
      res.json({ message: "Attendance rejected" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject attendance" });
    }
  });

  app.delete("/api/event-attendance/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEventAttendance(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete attendance" });
    }
  });

  // Print Submissions API
  // Anyone can view print submissions, but only printer managers and above can manage them
  app.get("/api/print-submissions", authenticateToken, async (_req, res) => {
    try {
      const submissions = await storage.getPrintSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch print submissions" });
    }
  });

  // Anyone can submit print requests
  app.post("/api/print-submissions", authenticateToken, upload.array('files', 10), async (req, res) => {
    try {
      console.log("Received print submission data:", req.body);
      console.log("Received files:", req.files);

      // Get uploaded file paths
      const files = req.files as Express.Multer.File[];
      const filePaths = files ? files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size
      })) : [];

      // Validate and transform the data
      const submissionData = {
        ...insertPrintSubmissionSchema.parse(req.body),
        uploadFiles: filePaths.length > 0 ? JSON.stringify(filePaths) : undefined
      };

      console.log("Validated submission data:", submissionData);

      const submission = await storage.createPrintSubmission(submissionData);
      res.status(201).json(submission);
    } catch (error) {
      // Clean up uploaded files if submission fails
      if (req.files) {
        const files = req.files as Express.Multer.File[];
        files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }

      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ message: "Invalid submission data", errors: error.errors });
      } else {
        console.error("Print submission error:", error);
        res.status(500).json({ message: "Failed to create print submission" });
      }
    }
  });

  // Only printer managers and above can update print submissions
  app.put("/api/print-submissions/:id", authenticateToken, requireMinimumRole(USER_ROLES.PRINTER_MANAGER), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const submission = await storage.updatePrintSubmission(id, updates);
      res.json(submission);
    } catch (error) {
      res.status(500).json({ message: "Failed to update print submission" });
    }
  });

  // Download files endpoint - require authentication
  app.get("/api/print-submissions/:id/download", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      const submission = await storage.getPrintSubmissionById(id);

      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      const fileData = submission.uploadFiles ? JSON.parse(submission.uploadFiles) : [];

      if (fileData.length === 0) {
        return res.status(404).json({ message: "No files found for this submission" });
      }

      // Import required modules
      const { default: archiver } = await import('archiver');

      const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="print-submission-${id}-files.zip"`);

      archive.pipe(res);

      // Add each file to the archive
      for (const file of fileData) {
        try {
          const filePath = typeof file === 'string' ? file : file.path;
          const fileName = typeof file === 'string' ? path.basename(file) : file.originalName;

          if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: fileName });
            console.log(`Added file to archive: ${fileName}`);
          } else {
            console.log(`File not found: ${filePath}`);
          }
        } catch (fileError) {
          console.error(`Error adding file to archive:`, fileError);
        }
      }

      archive.finalize();
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Failed to download files" });
    }
  });

  // Only printer managers and above can delete print submissions
  app.delete("/api/print-submissions/:id", authenticateToken, requireMinimumRole(USER_ROLES.PRINTER_MANAGER), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePrintSubmission(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete print submission" });
    }
  });

  // Special Roles API
  app.get("/api/special-roles", async (req, res) => {
    try {
      const roles = await storage.getSpecialRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch special roles" });
    }
  });

  app.post("/api/special-roles", async (req, res) => {
    try {
      const roleData = insertSpecialRoleSchema.parse(req.body);
      const role = await storage.createSpecialRole(roleData);
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid role data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create special role" });
      }
    }
  });

  app.put("/api/special-roles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const role = await storage.updateSpecialRole(id, updates);
      res.json(role);
    } catch (error) {
      res.status(500).json({ message: "Failed to update special role" });
    }
  });

  app.delete("/api/special-roles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSpecialRole(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete special role" });
    }
  });

  // Role Applications API
  app.get("/api/role-applications", async (req, res) => {
    try {
      const applications = await storage.getRoleApplications();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch role applications" });
    }
  });

  app.post("/api/role-applications", async (req, res) => {
    try {
      const applicationData = insertRoleApplicationSchema.parse(req.body);

      // Check for duplicate applications from the same UFID for the same role
      const existingApplications = await storage.getRoleApplications();
      const isDuplicate = existingApplications.some(app => 
        app.ufid === applicationData.ufid && 
        app.roleId === applicationData.roleId && 
        app.status === "pending"
      );

      if (isDuplicate) {
        return res.status(400).json({ 
          message: "You already have a pending application for this role." 
        });
      }

      const application = await storage.createRoleApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid application data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to submit role application" });
      }
    }
  });

  app.put("/api/role-applications/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { reviewedBy, reviewNotes } = req.body;
      const result = await storage.approveRoleApplication(id, reviewedBy, reviewNotes);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve role application" });
    }
  });

  app.put("/api/role-applications/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const { reviewedBy, reviewNotes } = req.body;
      const application = await storage.rejectRoleApplication(id, reviewedBy, reviewNotes);
      res.json(application);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject role application" });
    }
  });

  app.delete("/api/role-applications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRoleApplication(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete role application" });
    }
  });

  // Member Roles API
  app.get("/api/member-roles", async (_req, res) => {
    try {
      const memberRoles = await storage.getMemberRoles();
      res.json(memberRoles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member roles" });
    }
  });

  app.delete("/api/member-roles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.revokeMemberRole(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to revoke member role" });
    }
  });

  // Marketing Requests API
  // Marketing coordinators and above can view all marketing requests
  app.get("/api/marketing-requests", authenticateToken, requireMinimumRole(USER_ROLES.MARKETING_COORDINATOR), async (_req, res) => {
    try {
      const requests = await storage.getMarketingRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch marketing requests" });
    }
  });

  // Anyone can submit marketing requests
  app.post("/api/marketing-requests", authenticateToken, async (req, res) => {
    try {
      const requestData = insertMarketingRequestSchema.parse(req.body);
      const request = await storage.createMarketingRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid marketing request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to submit marketing request" });
      }
    }
  });

  // Only marketing coordinators and above can update marketing requests
  app.put("/api/marketing-requests/:id", authenticateToken, requireMinimumRole(USER_ROLES.MARKETING_COORDINATOR), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const request = await storage.updateMarketingRequest(id, updates);
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to update marketing request" });
    }
  });

  // Only marketing coordinators and above can delete marketing requests
  app.delete("/api/marketing-requests/:id", authenticateToken, requireMinimumRole(USER_ROLES.MARKETING_COORDINATOR), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMarketingRequest(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete marketing request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}