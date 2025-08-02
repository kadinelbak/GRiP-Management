import type { Express } from "express";
import { db } from "../db.js";
import { marketingRequests } from "../../shared/schema.js";
import { eq, and } from "drizzle-orm";
import { authenticateToken, USER_ROLES, requireMinimumRole } from "../auth.js";
import crypto from "crypto";

export function registerMarketingRoutes(app: Express) {
  // Submit marketing request (public)
  app.post("/api/marketing-requests", authenticateToken, async (req, res) => {
    try {
      const requestData = {
        id: crypto.randomUUID(),
        type: "marketing-request",
        title: req.body.title || req.body.requestType,
        name: req.body.name,
        email: req.body.email,
        organization: req.body.organization,
        requestType: req.body.requestType,
        description: req.body.description,
        message: req.body.message,
        priority: req.body.priority || "medium",
        status: "pending",
        requesterName: req.body.name,
        requesterEmail: req.body.email,
      };

      await db.insert(marketingRequests).values(requestData);
      res.status(201).json({ message: "Marketing request submitted successfully", id: requestData.id });
    } catch (error) {
      console.error("Error submitting marketing request:", error);
      res.status(500).json({ message: "Failed to submit marketing request" });
    }
  });

  // Get marketing requests
  app.get("/api/marketing-requests", authenticateToken, requireMinimumRole(USER_ROLES.MARKETING_COORDINATOR), async (req, res) => {
    try {
      const requests = await db.select().from(marketingRequests).where(eq(marketingRequests.type, "marketing-request"));
      res.json(requests);
    } catch (error) {
      console.error("Error fetching marketing requests:", error);
      res.status(500).json({ message: "Failed to fetch marketing requests" });
    }
  });

  // Update marketing request
  app.put("/api/marketing-requests/:id", authenticateToken, requireMinimumRole(USER_ROLES.MARKETING_COORDINATOR), async (req, res) => {
    try {
      const { id } = req.params;
      await db.update(marketingRequests)
        .set({ ...req.body, updatedAt: new Date() })
        .where(and(eq(marketingRequests.id, id), eq(marketingRequests.type, "marketing-request")));
      res.json({ message: "Marketing request updated successfully" });
    } catch (error) {
      console.error("Error updating marketing request:", error);
      res.status(500).json({ message: "Failed to update marketing request" });
    }
  });

  // Delete marketing request
  app.delete("/api/marketing-requests/:id", authenticateToken, requireMinimumRole(USER_ROLES.MARKETING_COORDINATOR), async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(marketingRequests)
        .where(and(eq(marketingRequests.id, id), eq(marketingRequests.type, "marketing-request")));
      res.json({ message: "Marketing request deleted successfully" });
    } catch (error) {
      console.error("Error deleting marketing request:", error);
      res.status(500).json({ message: "Failed to delete marketing request" });
    }
  });

  // Marketing Management Routes
  
  // Get all marketing requests (for marketing coordinators)
  app.get("/api/marketing-management/requests", authenticateToken, requireMinimumRole(USER_ROLES.MARKETING_COORDINATOR), async (req, res) => {
    try {
      const { status } = req.query;
      
      let query;
      if (status && status !== 'all') {
        query = db.select().from(marketingRequests).where(and(
          eq(marketingRequests.type, 'marketing-request'),
          eq(marketingRequests.status, status as string)
        ));
      } else {
        query = db.select().from(marketingRequests).where(eq(marketingRequests.type, 'marketing-request'));
      }

      const requests = await query;
      res.json(requests);
    } catch (error) {
      console.error("Error fetching marketing requests:", error);
      res.status(500).json({ message: "Failed to fetch marketing requests" });
    }
  });

  // Update marketing request status
  app.put("/api/marketing-management/requests/:id/status", authenticateToken, requireMinimumRole(USER_ROLES.MARKETING_COORDINATOR), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, responseMessage } = req.body;

      await db.update(marketingRequests)
        .set({ 
          status,
          responseMessage,
          updatedAt: new Date()
        })
        .where(and(
          eq(marketingRequests.id, id),
          eq(marketingRequests.type, 'marketing-request')
        ));

      res.json({ message: "Marketing request status updated successfully" });
    } catch (error) {
      console.error("Error updating marketing request status:", error);
      res.status(500).json({ message: "Failed to update marketing request status" });
    }
  });
}
