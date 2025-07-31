// Load environment variables first
import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import path from "path";
import { fileURLToPath } from "url";

// Handle both development and production environments
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`Error ${status} on ${req.method} ${req.path}:`, err);
    
    // Don't expose internal error details in production
    if (app.get("env") === "production" && status === 500) {
      res.status(status).json({ message: "Internal Server Error" });
    } else {
      res.status(status).json({ message });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // For now, serve built files instead of using Vite middleware
    // await setupVite(app, server);
    const staticPath = path.resolve(__dirname, "../dist/client");
    const indexPath = path.resolve(__dirname, "../dist/client/index.html");
    
    console.log("Serving static files from:", staticPath);
    console.log("Index file location:", indexPath);
    
    // Serve static assets
    app.use(express.static(staticPath, {
      index: false,
      maxAge: '1d'
    }));

    // Health check for deployment
    app.get("/health", (req, res) => {
      res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Handle client-side routing - serve index.html for all non-API routes
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ message: "API endpoint not found" });
      }
      
      try {
        res.sendFile(indexPath, (err) => {
          if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Internal Server Error');
          }
        });
      } catch (error) {
        console.error('Error in catch-all route:', error);
        next(error);
      }
    });
  } else {
    // Production: serve static files
    const staticPath = path.resolve(__dirname, "../dist/client");
    const indexPath = path.resolve(__dirname, "../dist/client/index.html");
    
    console.log("Serving static files from:", staticPath);
    console.log("Index file location:", indexPath);
    
    // Serve static assets
    app.use(express.static(staticPath, {
      index: false,
      maxAge: '1d'
    }));

    // Health check for deployment
    app.get("/health", (req, res) => {
      res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Handle client-side routing - serve index.html for all non-API routes
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ message: "API endpoint not found" });
      }
      
      try {
        res.sendFile(indexPath, (err) => {
          if (err) {
            console.error("Error serving index.html:", err);
            res.status(500).json({ message: "Failed to serve application" });
          }
        });
      } catch (error) {
        console.error("Catch-all route error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 3001 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3001', 10);
  
  // Windows-compatible server configuration
  server.listen(port, 'localhost', () => {
    log(`serving on http://localhost:${port}`);
  });
})();