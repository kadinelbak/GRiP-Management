import type { Express } from "express";
import { db } from "../db.js";
import { marketingRequests } from "../../shared/schema.js";
import { eq, and } from "drizzle-orm";
import { authenticateToken, USER_ROLES, requireMinimumRole } from "../auth.js";
import crypto from "crypto";

export function registerArtRoutes(app: Express) {
  // Submit a new art request (public)
  app.post("/api/art-requests", async (req, res) => {
    try {
      const artRequestData = {
        id: crypto.randomUUID(),
        type: "art-request",
        title: req.body.title,
        name: req.body.requesterName,
        email: req.body.requesterEmail,
        organization: req.body.organization || null,
        requestType: req.body.artType,
        description: req.body.description,
        message: req.body.description, // For compatibility
        priority: req.body.priority || 'medium',
        status: 'pending',
        details: JSON.stringify({
          artType: req.body.artType,
          deadline: req.body.deadline ? new Date(req.body.deadline) : null,
          dimensions: req.body.dimensions,
          colorPreferences: req.body.colorPreferences,
          style: req.body.style,
          targetAudience: req.body.targetAudience,
          usage: req.body.usage,
          references: req.body.references,
          additionalNotes: req.body.additionalNotes,
        }),
        requesterName: req.body.requesterName,
        requesterEmail: req.body.requesterEmail,
      };

      await db.insert(marketingRequests).values(artRequestData);
      res.status(201).json({ message: "Art request submitted successfully", id: artRequestData.id });
    } catch (error) {
      console.error("Error submitting art request:", error);
      res.status(500).json({ message: "Failed to submit art request" });
    }
  });

  // Get all art requests (for art coordinators)
  app.get("/api/art-requests", authenticateToken, requireMinimumRole(USER_ROLES.ART_COORDINATOR), async (req, res) => {
    try {
      const { status } = req.query;
      
      let query;
      if (status && status !== 'all') {
        query = db.select().from(marketingRequests).where(and(
          eq(marketingRequests.type, 'art-request'),
          eq(marketingRequests.status, status as string)
        ));
      } else {
        query = db.select().from(marketingRequests).where(eq(marketingRequests.type, 'art-request'));
      }

      const requests = await query;
      
      // Parse the details field to get full art request data
      const artRequests = requests.map(req => {
        const details = req.details ? JSON.parse(req.details) : {};
        return {
          id: req.id,
          title: req.title,
          description: req.description,
          priority: req.priority,
          status: req.status,
          requesterName: req.requesterName,
          requesterEmail: req.requesterEmail,
          createdAt: req.submittedAt,
          updatedAt: req.updatedAt,
          ...details
        };
      });

      res.json(artRequests);
    } catch (error) {
      console.error("Error fetching art requests:", error);
      res.status(500).json({ message: "Failed to fetch art requests" });
    }
  });

  // Update art request status
  app.put("/api/art-requests/:id/status", authenticateToken, requireMinimumRole(USER_ROLES.ART_COORDINATOR), async (req, res) => {
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
          eq(marketingRequests.type, 'art-request')
        ));

      res.json({ message: "Art request status updated successfully" });
    } catch (error) {
      console.error("Error updating art request status:", error);
      res.status(500).json({ message: "Failed to update art request status" });
    }
  });
}
