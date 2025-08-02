import type { Express } from "express";
import { authenticateToken, requireAdmin, requireAuth, USER_ROLES, requireMinimumRole } from "../auth.js";
import { 
  register, login, logout, getCurrentUser, changePassword, 
  requestPasswordReset, resetPassword, getAllUsers, updateUser,
  signup
} from "../auth-routes.js";

export function registerAuthRoutes(app: Express) {
  // Authentication routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", authenticateToken, getCurrentUser);
  app.post("/api/auth/change-password", authenticateToken, changePassword);
  app.post("/api/auth/request-password-reset", requestPasswordReset);
  app.post("/api/auth/reset-password", resetPassword);
  app.post("/api/auth/signup", signup);

  // User management routes (admin only)
  app.get("/api/users", authenticateToken, requireAdmin, getAllUsers);
  app.put("/api/users/:id", authenticateToken, requireAdmin, updateUser);
}
