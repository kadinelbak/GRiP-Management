import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'technical' or 'additional'
  maxCapacity: integer("max_capacity").notNull(),
  currentSize: integer("current_size").notNull().default(0),
  meetingTime: text("meeting_time"),
  requiredSkills: text("required_skills"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  ufid: text("ufid").notNull(),
  teamPreferences: json("team_preferences").$type<string[]>().notNull().default([]), // Up to 9 ranked preferences
  skills: json("skills").$type<string[]>().notNull().default([]),
  additionalSkills: text("additional_skills"),
  timeAvailability: json("time_availability").$type<{ day: string; startTime: string; endTime: string }[]>().notNull().default([]),
  acknowledgments: json("acknowledgments").$type<boolean[]>().notNull(),
  assignedTeamId: varchar("assigned_team_id").references(() => teams.id),
  status: text("status").notNull().default("pending"), // 'pending', 'assigned', 'waitlisted'
  assignmentReason: text("assignment_reason"), // Explanation of why assigned to this team
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const additionalTeamSignups = pgTable("additional_team_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  ufid: text("ufid").notNull(),
  selectedTeams: json("selected_teams").$type<string[]>().notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const projectRequests = pgTable("project_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  projectType: text("project_type").notNull(),
  projectTitle: text("project_title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // 'urgent', 'high', 'medium', 'low'
  budgetConsiderations: text("budget_considerations"),
  howHeardAbout: text("how_heard_about"),
  consentGiven: boolean("consent_given").notNull().default(false),
  status: text("status").notNull().default("submitted"), // 'submitted', 'reviewing', 'approved', 'completed'
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const teamsRelations = relations(teams, ({ many }) => ({
  applications: many(applications),
  assignedApplications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  assignedTeam: one(teams, {
    fields: [applications.assignedTeamId],
    references: [teams.id],
  }),
}));

// Insert schemas
export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  currentSize: true,
  createdAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  assignedTeamId: true,
  status: true,
  assignmentReason: true,
  submittedAt: true,
}).extend({
  email: z.string().email("Invalid email format"),
  ufid: z.string().regex(/^\d{8}$/, "UFID must be exactly 8 digits"),
  teamPreferences: z.array(z.string()).min(1, "At least one team preference required").max(9, "Maximum 9 team preferences allowed"),
  timeAvailability: z.array(z.object({
    day: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })).min(1, "At least one time availability slot required"),
  acknowledgments: z.array(z.boolean()).length(7, "All acknowledgments must be completed"),
});

export const insertAdditionalTeamSignupSchema = createInsertSchema(additionalTeamSignups).omit({
  id: true,
  submittedAt: true,
}).extend({
  email: z.string().email("Invalid email format"),
  ufid: z.string().regex(/^\d{8}$/, "UFID must be exactly 8 digits"),
  selectedTeams: z.array(z.string()).min(1, "At least one team must be selected"),
});

export const insertProjectRequestSchema = createInsertSchema(projectRequests).omit({
  id: true,
  status: true,
  submittedAt: true,
}).extend({
  email: z.string().email("Invalid email format"),
  consentGiven: z.boolean().refine(val => val === true, "Consent must be given"),
});

export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type Team = typeof teams.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type AdditionalTeamSignup = typeof additionalTeamSignups.$inferSelect;
export type ProjectRequest = typeof projectRequests.$inferSelect;
export type AdminSetting = typeof adminSettings.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertAdditionalTeamSignup = z.infer<typeof insertAdditionalTeamSignupSchema>;
export type InsertProjectRequest = z.infer<typeof insertProjectRequestSchema>;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
