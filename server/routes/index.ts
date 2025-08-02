import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerAuthRoutes } from "./auth.js";
import { registerTeamsRoutes } from "./teams.js";
import { registerApplicationsRoutes } from "./applications.js";
import { registerMarketingRoutes } from "./marketing.js";
import { registerArtRoutes } from "./art.js";
import { registerNewsRoutes } from "./news.js";
import { registerAdminRoutes } from "./admin.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register all route modules
  registerAuthRoutes(app);
  registerTeamsRoutes(app);
  registerApplicationsRoutes(app);
  registerMarketingRoutes(app);
  registerArtRoutes(app);
  registerNewsRoutes(app);
  registerAdminRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
