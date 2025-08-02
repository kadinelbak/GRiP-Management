import type { Express } from "express";
import { createServer, type Server } from "http";

// Import the new modular routes
export { registerRoutes } from "./routes/index.js";
