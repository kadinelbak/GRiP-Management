import type { Express } from "express";
import { db } from "../db.js";
import { teams, applications, additionalTeamSignups } from "../../shared/schema.js";
import { eq, sql } from "drizzle-orm";
import { authenticateToken, requireAdmin, USER_ROLES, requireMinimumRole } from "../auth.js";
import crypto from "crypto";

export function registerTeamsRoutes(app: Express) {
  // Get all teams
  app.get("/api/teams", async (req, res) => {
    try {
      const allTeams = await db.select().from(teams);
      res.json(allTeams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  // Create a new team
  app.post("/api/teams", authenticateToken, requireMinimumRole(USER_ROLES.PROJECT_MANAGER), async (req, res) => {
    try {
      const teamData = {
        id: crypto.randomUUID(),
        name: req.body.name,
        type: req.body.type,
        maxCapacity: req.body.maxCapacity,
        meetingTime: req.body.meetingTime,
        location: req.body.location,
        requiredSkills: req.body.requiredSkills,
        description: req.body.description,
      };

      await db.insert(teams).values(teamData);
      res.status(201).json({ message: "Team created successfully", team: teamData });
    } catch (error) {
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  // Get team by ID with members
  app.get("/api/teams/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const team = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
      
      if (team.length === 0) {
        return res.status(404).json({ message: "Team not found" });
      }

      const members = await db.select().from(applications).where(eq(applications.assignedTeamId, id));
      
      res.json({ ...team[0], members });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  // Update team
  app.put("/api/teams/:id", authenticateToken, requireMinimumRole(USER_ROLES.PROJECT_MANAGER), async (req, res) => {
    try {
      const { id } = req.params;
      await db.update(teams).set(req.body).where(eq(teams.id, id));
      res.json({ message: "Team updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  // Delete team
  app.delete("/api/teams/:id", authenticateToken, requireMinimumRole(USER_ROLES.PROJECT_MANAGER), async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(teams).where(eq(teams.id, id));
      res.json({ message: "Team deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Additional team signups
  app.post("/api/additional-teams", async (req, res) => {
    try {
      const signupData = {
        id: crypto.randomUUID(),
        fullName: req.body.fullName,
        email: req.body.email,
        ufid: req.body.ufid,
        selectedTeams: req.body.selectedTeams,
      };

      await db.insert(additionalTeamSignups).values(signupData);
      res.status(201).json({ message: "Additional team signup submitted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit additional team signup" });
    }
  });

  // Get additional team signups
  app.get("/api/additional-teams", authenticateToken, requireMinimumRole(USER_ROLES.PROJECT_MANAGER), async (req, res) => {
    try {
      const signups = await db.select().from(additionalTeamSignups);
      res.json(signups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch additional team signups" });
    }
  });
}
