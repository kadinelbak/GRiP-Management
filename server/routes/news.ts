import type { Express } from "express";
import { storage } from "../storage.js";
import { authenticateToken, USER_ROLES, requireMinimumRole } from "../auth.js";
import crypto from "crypto";

export function registerNewsRoutes(app: Express) {
  // Get news statistics (public access)
  app.get("/api/news/stats", async (req, res) => {
    try {
      // Create basic stats from news stories
      const allStories = await storage.getAllNewsStories();
      const stats = {
        total: allStories.length,
        published: allStories.filter(s => s.status === 'published').length,
        pending: allStories.filter(s => s.status === 'pending').length,
        draft: allStories.filter(s => s.status === 'draft').length
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch news statistics" });
    }
  });

  // Get all published news stories (public access)
  app.get("/api/news", async (req, res) => {
    try {
      const stories = await storage.getPublishedNewsStories();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch news stories" });
    }
  });

  // Get all news stories with status filtering (admin access)
  app.get("/api/news/admin", authenticateToken, requireMinimumRole(USER_ROLES.ART_COORDINATOR), async (req, res) => {
    try {
      const { status } = req.query;
      const stories = await storage.getAllNewsStories(status as string);
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch news stories" });
    }
  });

  // Get single news story by ID
  app.get("/api/news/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const story = await storage.getNewsStoryById(id);
      if (!story) {
        return res.status(404).json({ message: "News story not found" });
      }
      res.json(story);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch news story" });
    }
  });

  // Create new news story (authenticated users with special roles)
  app.post("/api/news", authenticateToken, requireMinimumRole(USER_ROLES.ART_COORDINATOR), async (req, res) => {
    try {
      const user = (req as any).user;
      const storyData = {
        id: crypto.randomUUID(),
        title: req.body.title,
        content: req.body.content || '',
        summary: req.body.summary || '',
        type: req.body.type || 'story',
        imageUrl: req.body.imageUrl || null,
        linkUrl: req.body.linkUrl || null,
        tags: req.body.tags || [],
        status: 'draft',
        authorId: user.id,
        publishDate: req.body.publishDate ? new Date(req.body.publishDate) : undefined
      };

      const story = await storage.createNewsStory(storyData);
      res.status(201).json({ message: "News story created successfully", story });
    } catch (error) {
      console.error("Error creating news story:", error);
      res.status(500).json({ message: "Failed to create news story" });
    }
  });

  // Submit news story for review (public access, no auth required)
  app.post("/api/news/submit", async (req, res) => {
    try {
      const storyData = {
        id: crypto.randomUUID(),
        title: req.body.title,
        content: req.body.content || '',
        summary: req.body.summary || '',
        type: req.body.type || 'story',
        imageUrl: req.body.imageUrl || null,
        linkUrl: req.body.linkUrl || null,
        tags: req.body.tags || [],
        status: 'pending',
        authorId: 'public', // Use a placeholder for public submissions
        publishDate: req.body.publishDate ? new Date(req.body.publishDate) : undefined
      };

      const story = await storage.createNewsStory(storyData);
      res.status(201).json({ message: "News story submitted for review", story });
    } catch (error) {
      console.error("Error submitting news story:", error);
      res.status(500).json({ message: "Failed to submit news story" });
    }
  });

  // Update news story (author or admin)
  app.put("/api/news/:id", authenticateToken, requireMinimumRole(USER_ROLES.ART_COORDINATOR), async (req, res) => {
    try {
      const { id } = req.params;
      const story = await storage.getNewsStoryById(id);
      
      if (!story) {
        return res.status(404).json({ message: "News story not found" });
      }

      const updateData = {
        title: req.body.title,
        content: req.body.content || '',
        summary: req.body.summary || '',
        type: req.body.type,
        imageUrl: req.body.imageUrl || null,
        linkUrl: req.body.linkUrl || null,
        tags: req.body.tags || [],
        publishDate: req.body.publishDate ? new Date(req.body.publishDate) : undefined
      };

      await storage.updateNewsStory(id, updateData);
      res.json({ message: "News story updated successfully" });
    } catch (error) {
      console.error("Error updating news story:", error);
      res.status(500).json({ message: "Failed to update news story" });
    }
  });

  // Delete news story (author or admin)
  app.delete("/api/news/:id", authenticateToken, requireMinimumRole(USER_ROLES.ART_COORDINATOR), async (req, res) => {
    try {
      const { id } = req.params;
      const story = await storage.getNewsStoryById(id);
      
      if (!story) {
        return res.status(404).json({ message: "News story not found" });
      }

      await storage.deleteNewsStory(id);
      res.json({ message: "News story deleted successfully" });
    } catch (error) {
      console.error("Error deleting news story:", error);
      res.status(500).json({ message: "Failed to delete news story" });
    }
  });

  // Submit story for approval (move from draft to pending)
  app.post("/api/news/:id/submit", authenticateToken, requireMinimumRole(USER_ROLES.ART_COORDINATOR), async (req, res) => {
    try {
      const { id } = req.params;
      const story = await storage.getNewsStoryById(id);

      if (!story) {
        return res.status(404).json({ message: "News story not found" });
      }

      if (story.status !== 'draft') {
        return res.status(400).json({ message: "Only draft stories can be submitted for approval" });
      }

      await storage.updateNewsStory(id, { status: 'pending_approval' });
      res.json({ message: "Story submitted for approval" });
    } catch (error) {
      console.error("Error submitting story:", error);
      res.status(500).json({ message: "Failed to submit story" });
    }
  });

  // Approve or reject news story
  app.post("/api/news/:id/review", authenticateToken, requireMinimumRole(USER_ROLES.ART_COORDINATOR), async (req, res) => {
    try {
      const { id } = req.params;
      const { action, feedback } = req.body; // action: 'approve' or 'reject'
      const user = (req as any).user;

      const story = await storage.getNewsStoryById(id);
      if (!story) {
        return res.status(404).json({ message: "News story not found" });
      }

      if (story.status !== 'pending_approval' && story.status !== 'pending_review') {
        return res.status(400).json({ message: "Story is not pending approval" });
      }

      // Record the approval/rejection
      const approvalData = {
        id: crypto.randomUUID(),
        storyId: id,
        approverId: user.id,
        approved: action === 'approve',
        comments: feedback || null
      };

      await storage.addNewsApproval(approvalData);

      // Check if we have enough approvals (need 2 approvals)
      const approvals = await storage.getNewsApprovalsWithDetails(id);
      const approvalCount = approvals.filter(a => a.approved === true).length;
      const rejectionCount = approvals.filter(a => a.approved === false).length;

      let newStatus = story.status;
      if (rejectionCount > 0) {
        newStatus = 'rejected';
      } else if (approvalCount >= 2) {
        newStatus = 'approved';
      }

      if (newStatus !== story.status) {
        await storage.updateNewsStory(id, { status: newStatus });
      }

      res.json({ 
        message: `Story ${action}d successfully`, 
        status: newStatus,
        approvalsNeeded: Math.max(0, 2 - approvalCount)
      });
    } catch (error) {
      console.error("Error reviewing story:", error);
      res.status(500).json({ message: "Failed to review story" });
    }
  });

  // Publish approved story
  app.post("/api/news/:id/publish", authenticateToken, requireMinimumRole(USER_ROLES.PROJECT_MANAGER), async (req, res) => {
    try {
      const { id } = req.params;
      const story = await storage.getNewsStoryById(id);

      if (!story) {
        return res.status(404).json({ message: "News story not found" });
      }

      if (story.status !== 'approved') {
        return res.status(400).json({ message: "Only approved stories can be published" });
      }

      await storage.updateNewsStory(id, { 
        status: 'published',
        publishDate: new Date()
      });
      res.json({ message: "Story published successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to publish story" });
    }
  });

  // Get approvals for a story
  app.get("/api/news/:id/approvals", authenticateToken, requireMinimumRole(USER_ROLES.ART_COORDINATOR), async (req, res) => {
    try {
      const { id } = req.params;
      const approvals = await storage.getNewsApprovalsWithDetails(id);
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch story approvals" });
    }
  });
}
