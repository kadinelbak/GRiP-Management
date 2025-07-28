import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTeamSchema, insertApplicationSchema, insertAdditionalTeamSignupSchema, 
  insertProjectRequestSchema, insertAdminSettingSchema, insertAbsenceSchema,
  insertEventSchema, insertEventAttendanceSchema
} from "@shared/schema";
import { z } from "zod";

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
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accepted members" });
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
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid event data", errors: error.errors });
      } else {
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

  const httpServer = createServer(app);
  return httpServer;
}