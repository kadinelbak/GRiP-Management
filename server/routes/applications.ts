import type { Express } from "express";
import { db } from "../db.js";
import { applications, teams } from "../../shared/schema.js";
import { eq, sql } from "drizzle-orm";
import { authenticateToken, USER_ROLES, requireMinimumRole } from "../auth.js";
import crypto from "crypto";

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
  const teamCapacities = new Map<string, number>();
  const teamCurrentSizes = new Map<string, number>();

  // Initialize team capacities and current sizes
  teams.forEach(team => {
    teamCapacities.set(team.id, team.maxCapacity);
    teamCurrentSizes.set(team.id, team.currentSize || 0);
  });

  // Sort applications by submission time (first come, first served within preferences)
  const sortedApplications = [...applications].sort((a, b) => 
    new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );

  sortedApplications.forEach(app => {
    let assigned = false;
    let assignmentReason = "";

    // Try to assign based on preferences (1st choice, then 2nd, etc.)
    for (let i = 0; i < app.teamPreferences.length && !assigned; i++) {
      const preferredTeamId = app.teamPreferences[i];
      const currentSize = teamCurrentSizes.get(preferredTeamId) || 0;
      const maxCapacity = teamCapacities.get(preferredTeamId) || 0;

      if (currentSize < maxCapacity) {
        // Assign to this team
        assignments.push({
          applicationId: app.id,
          assignedTeamId: preferredTeamId,
          status: 'assigned',
          reasoning: `Assigned to ${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} choice team`,
          preferenceRank: i + 1
        });

        teamCurrentSizes.set(preferredTeamId, currentSize + 1);
        assigned = true;
        assignmentReason = `Assigned to ${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} choice team`;
      }
    }

    // If not assigned to any preferred team, add to waitlist
    if (!assigned) {
      assignments.push({
        applicationId: app.id,
        assignedTeamId: null,
        status: 'waitlisted',
        reasoning: 'All preferred teams are full'
      });
    }
  });

  const summary = {
    totalApplications: applications.length,
    assigned: assignments.filter(a => a.status === 'assigned').length,
    waitlisted: assignments.filter(a => a.status === 'waitlisted').length,
    timestamp: new Date().toISOString()
  };

  return { assignments, summary };
}

export function registerApplicationsRoutes(app: Express) {
  // Submit application
  app.post("/api/applications", async (req, res) => {
    try {
      const applicationData = {
        id: crypto.randomUUID(),
        fullName: req.body.fullName,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        ufid: req.body.ufid,
        teamPreferences: req.body.teamPreferences,
        additionalTeams: req.body.additionalTeams || [],
        skills: req.body.skills,
        additionalSkills: req.body.additionalSkills,
        timeAvailability: req.body.timeAvailability,
        acknowledgments: req.body.acknowledgments,
      };

      await db.insert(applications).values(applicationData);
      res.status(201).json({ message: "Application submitted successfully" });
    } catch (error) {
      console.error("Error submitting application:", error);
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  // Get all applications
  app.get("/api/applications", authenticateToken, requireMinimumRole(USER_ROLES.PROJECT_MANAGER), async (req, res) => {
    try {
      const allApplications = await db.select().from(applications);
      res.json(allApplications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Get application by ID
  app.get("/api/applications/:id", authenticateToken, requireMinimumRole(USER_ROLES.PROJECT_MANAGER), async (req, res) => {
    try {
      const { id } = req.params;
      const application = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
      
      if (application.length === 0) {
        return res.status(404).json({ message: "Application not found" });
      }

      res.json(application[0]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  // Update application
  app.put("/api/applications/:id", authenticateToken, requireMinimumRole(USER_ROLES.PROJECT_MANAGER), async (req, res) => {
    try {
      const { id } = req.params;
      await db.update(applications).set(req.body).where(eq(applications.id, id));
      res.json({ message: "Application updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Delete application
  app.delete("/api/applications/:id", authenticateToken, requireMinimumRole(USER_ROLES.PROJECT_MANAGER), async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(applications).where(eq(applications.id, id));
      res.json({ message: "Application deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  // Auto-assign teams
  app.post("/api/applications/auto-assign", authenticateToken, requireMinimumRole(USER_ROLES.PROJECT_MANAGER), async (req, res) => {
    try {
      const allApplications = await db.select().from(applications);
      const allTeams = await db.select().from(teams);

      const report = performTeamAssignment(allApplications, allTeams);

      // Apply assignments to database
      for (const assignment of report.assignments) {
        await db.update(applications)
          .set({
            assignedTeamId: assignment.assignedTeamId,
            status: assignment.status,
            assignmentReason: assignment.reasoning
          })
          .where(eq(applications.id, assignment.applicationId));
      }

      // Update team current sizes
      for (const team of allTeams) {
        const assignedCount = report.assignments.filter(a => 
          a.assignedTeamId === team.id && a.status === 'assigned'
        ).length;
        
        await db.update(teams)
          .set({ currentSize: (team.currentSize || 0) + assignedCount })
          .where(eq(teams.id, team.id));
      }

      res.json({ 
        message: "Team assignments completed successfully", 
        report 
      });
    } catch (error) {
      console.error("Error during auto-assignment:", error);
      res.status(500).json({ message: "Failed to perform team assignments" });
    }
  });

  // Get assignment statistics
  app.get("/api/applications/stats", authenticateToken, requireMinimumRole(USER_ROLES.PROJECT_MANAGER), async (req, res) => {
    try {
      const totalApplications = await db.select({ count: sql<number>`count(*)` }).from(applications);
      const assignedApplications = await db.select({ count: sql<number>`count(*)` }).from(applications).where(eq(applications.status, 'assigned'));
      const waitlistedApplications = await db.select({ count: sql<number>`count(*)` }).from(applications).where(eq(applications.status, 'waitlisted'));

      res.json({
        total: totalApplications[0].count,
        assigned: assignedApplications[0].count,
        waitlisted: waitlistedApplications[0].count,
        pending: totalApplications[0].count - assignedApplications[0].count - waitlistedApplications[0].count
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch application statistics" });
    }
  });
}
