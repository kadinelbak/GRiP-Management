import type { Express } from "express";
import { authenticateToken, requireAdmin, USER_ROLES, requireMinimumRole } from "../auth.js";
import { generateSimpleAdminCode, getCurrentSimpleAdminCode } from "../ultra-simple-admin.js";

export function registerAdminRoutes(app: Express) {
  // Generate simple admin code
  app.post("/api/admin/generate-code", authenticateToken, requireAdmin, (req, res) => {
    generateSimpleAdminCode(req, res);
  });

  // Get current simple admin code
  app.get("/api/admin/current-code", authenticateToken, requireAdmin, (req, res) => {
    getCurrentSimpleAdminCode(req, res);
  });

  // Admin dashboard stats
  app.get("/api/admin/stats", authenticateToken, requireMinimumRole(USER_ROLES.CAPTAIN), async (req, res) => {
    try {
      // This would typically aggregate data from various tables
      // For now, return a basic structure
      res.json({
        applications: { total: 0, pending: 0, assigned: 0 },
        teams: { total: 0, filled: 0, available: 0 },
        projects: { total: 0, active: 0, completed: 0 },
        news: { total: 0, published: 0, pending: 0 },
        marketing: { total: 0, pending: 0, completed: 0 },
        art: { total: 0, pending: 0, completed: 0 }
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin statistics" });
    }
  });
}
