import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTeamSchema, insertApplicationSchema, insertAdditionalTeamSignupSchema, 
  insertProjectRequestSchema, insertAdminSettingSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.post("/api/applications/assign-teams", async (_req, res) => {
    try {
      await storage.assignTeamsAutomatically();
      res.json({ message: "Teams assigned successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to assign teams" });
    }
  });

  // CSV Export
  app.get("/api/applications/export", async (_req, res) => {
    try {
      const applications = await storage.getApplications();
      const teams = await storage.getTeams();
      const teamMap = new Map(teams.map(t => [t.id, t.name]));

      const csvHeader = "Name,Email,UFID,Preferred Team,Assigned Team,Status,Skills,Submitted At\n";
      const csvRows = applications.map(app => {
        const preferredTeam = app.preferredTeamId ? teamMap.get(app.preferredTeamId) || "Unknown" : "None";
        const assignedTeam = app.assignedTeamId ? teamMap.get(app.assignedTeamId) || "Unknown" : "None";
        const skills = Array.isArray(app.skills) ? app.skills.join("; ") : "";
        
        return [
          `"${app.fullName}"`,
          `"${app.email}"`,
          `"${app.ufid}"`,
          `"${preferredTeam}"`,
          `"${assignedTeam}"`,
          `"${app.status}"`,
          `"${skills}"`,
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
      const applications = await storage.getApplications();
      const teams = await storage.getTeams();
      const projectRequests = await storage.getProjectRequests();
      const additionalSignups = await storage.getAdditionalTeamSignups();

      const stats = {
        totalApplications: applications.length,
        assignedApplications: applications.filter(app => app.status === "assigned").length,
        waitlistedApplications: applications.filter(app => app.status === "waitlisted").length,
        totalTeams: teams.length,
        filledTeams: teams.filter(team => team.currentSize >= team.maxCapacity).length,
        totalProjectRequests: projectRequests.length,
        totalAdditionalSignups: additionalSignups.length,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
