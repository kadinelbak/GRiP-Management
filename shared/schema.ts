import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'technical', 'additional', or 'constant'
  maxCapacity: integer("max_capacity").notNull(),
  currentSize: integer("current_size").notNull().default(0),
  meetingTime: text("meeting_time"),
  location: text("location"),
  requiredSkills: text("required_skills"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").notNull(),
  ufid: text("ufid").notNull(),
  teamPreferences: json("team_preferences").$type<string[]>().notNull().default([]), // Up to 9 ranked preferences
  additionalTeams: json("additional_teams").$type<string[]>().notNull().default([]), // Additional teams they want to join
  skills: json("skills").$type<string[]>().notNull().default([]),
  additionalSkills: text("additional_skills"),
  timeAvailability: json("time_availability").$type<{ day: string; startTime: string; endTime: string }[]>().notNull().default([]),
  acknowledgments: json("acknowledgments").$type<boolean[]>().notNull(),
  assignedTeamId: varchar("assigned_team_id").references(() => teams.id),
  status: text("status").notNull().default("pending"), // 'pending', 'assigned', 'waitlisted'
  assignmentReason: text("assignment_reason"), // Explanation of why assigned to this team
  points: integer("points").notNull().default(0), // Total event points earned
  events: json("events").$type<string[]>().notNull().default([]), // Array of attended event IDs
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

export const absences = pgTable("absences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id),
  reason: text("reason"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: timestamp("event_date").notNull(),
  location: text("location").notNull(),
  points: integer("points").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const eventAttendance = pgTable("event_attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  fullName: text("full_name").notNull(),
  ufid: text("ufid").notNull(),
  photo: text("photo"), // Base64 encoded photo or file path
  socialMediaPermission: boolean("social_media_permission").notNull().default(false),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by"),
});

// Print Submissions
export const printSubmissions = pgTable("print_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  submitterName: text("submitter_name").notNull(),
  emailAddress: text("email_address").notNull(),
  requestType: text("request_type").notNull(), // "Adaptive Gaming", "Test", etc.
  teamName: text("team_name"),
  color: text("color"), // Preferred print color
  uploadFiles: text("upload_files"), // JSON array of file paths
  generalPrintDescription: text("general_print_description"),
  fileSpecifications: text("file_specifications"),
  comments: text("comments"),
  deadline: timestamp("deadline"), // When the print is needed by
  status: text("status").notNull().default("submitted"), // submitted, in_progress, completed, cancelled
  progress: integer("progress").notNull().default(0), // 0-100
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Special Roles
export const specialRoles = pgTable("special_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  responsibilities: text("responsibilities"),
  requirements: text("requirements"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Role Applications
export const roleApplications = pgTable("role_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull().references(() => specialRoles.id),
  applicantName: text("applicant_name").notNull(),
  applicantEmail: text("applicant_email").notNull(),
  ufid: text("ufid").notNull(),
  currentTeam: text("current_team"),
  experience: text("experience"),
  motivation: text("motivation"),
  availability: text("availability"),
  additionalInfo: text("additional_info"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  reviewedBy: text("reviewed_by"),
  reviewNotes: text("review_notes"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Member Roles (assigned roles)
export const memberRoles = pgTable("member_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id),
  roleId: varchar("role_id").notNull().references(() => specialRoles.id),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  assignedBy: text("assigned_by"),
  isActive: boolean("is_active").notNull().default(true),
});

// Marketing Requests
export const marketingRequests = pgTable("marketing_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  organization: text("organization"),
  requestType: text("request_type").notNull(),
  message: text("message").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

// Authentication Tables
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("member"), // 'admin', 'project_manager', 'printer_manager', 'president', 'captain', 'recipient_coordinator', 'outreach_coordinator', 'marketing_coordinator', 'art_coordinator', 'member'
  firstName: text("first_name"),
  lastName: text("last_name"),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const passwordResets = pgTable("password_resets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminSignupCodes = pgTable("admin_signup_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const inviteCodes = pgTable("invite_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  role: text("role").notNull(),
  maxUses: integer("max_uses").notNull().default(1),
  currentUses: integer("current_uses").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// News Stories
export const newsStories = pgTable("news_stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content"), // Rich text content for full stories
  summary: text("summary"), // Brief summary/excerpt
  type: text("type").notNull(), // 'story', 'event', 'link', 'announcement'
  imageUrl: text("image_url"), // URL to image/photo
  linkUrl: text("link_url"), // External link for link-type posts
  tags: json("tags").$type<string[]>().notNull().default([]), // Tags for categorization
  status: text("status").notNull().default("draft"), // 'draft', 'pending', 'approved', 'published', 'rejected'
  authorId: varchar("author_id").notNull().references(() => users.id),
  publishDate: timestamp("publish_date"), // When to publish (can be future date)
  isActive: boolean("is_active").notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// News Story Approvals (two-person approval system)
export const newsApprovals = pgTable("news_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => newsStories.id),
  approverId: varchar("approver_id").notNull().references(() => users.id),
  approved: boolean("approved").notNull(), // true for approval, false for rejection
  comments: text("comments"), // Optional feedback from approver
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const teamsRelations = relations(teams, ({ many }) => ({
  applications: many(applications),
  assignedApplications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  assignedTeam: one(teams, {
    fields: [applications.assignedTeamId],
    references: [teams.id],
  }),
  absences: many(absences),
}));

export const absencesRelations = relations(absences, ({ one }) => ({
  application: one(applications, {
    fields: [absences.applicationId],
    references: [applications.id],
  }),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  attendance: many(eventAttendance),
}));

export const eventAttendanceRelations = relations(eventAttendance, ({ one }) => ({
  event: one(events, {
    fields: [eventAttendance.eventId],
    references: [events.id],
  }),
}));

export const specialRolesRelations = relations(specialRoles, ({ many }) => ({
  applications: many(roleApplications),
  assignments: many(memberRoles),
}));

export const roleApplicationsRelations = relations(roleApplications, ({ one }) => ({
  role: one(specialRoles, {
    fields: [roleApplications.roleId],
    references: [specialRoles.id],
  }),
}));

export const memberRolesRelations = relations(memberRoles, ({ one }) => ({
  application: one(applications, {
    fields: [memberRoles.applicationId],
    references: [applications.id],
  }),
  role: one(specialRoles, {
    fields: [memberRoles.roleId],
    references: [specialRoles.id],
  }),
}));

export const marketingRequestsRelations = relations(marketingRequests, ({ }) => ({}));

// Auth Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const adminSignupCodesRelations = relations(adminSignupCodes, ({ one }) => ({
  createdByUser: one(users, {
    fields: [adminSignupCodes.createdBy],
    references: [users.id],
  }),
}));

export const newsStoriesRelations = relations(newsStories, ({ one, many }) => ({
  author: one(users, {
    fields: [newsStories.authorId],
    references: [users.id],
  }),
  approvals: many(newsApprovals),
}));

export const newsApprovalsRelations = relations(newsApprovals, ({ one }) => ({
  story: one(newsStories, {
    fields: [newsApprovals.storyId],
    references: [newsStories.id],
  }),
  approver: one(users, {
    fields: [newsApprovals.approverId],
    references: [users.id],
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
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  ufid: z.string().regex(/^\d{8}$/, "UFID must be exactly 8 digits"),
  teamPreferences: z.array(z.string()).min(1, "At least one team preference required").max(9, "Maximum 9 team preferences allowed"),
  additionalTeams: z.array(z.string()).optional().default([]),
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
});

export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertAbsenceSchema = createInsertSchema(absences).omit({
  id: true,
  createdAt: true,
}).extend({
  applicationId: z.string().min(1, "Application ID is required"),
  startDate: z.string().min(1, "Start date is required"),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
}).extend({
  title: z.string().min(1, "Event title is required"),
  eventDate: z.string().min(1, "Event date is required").transform((val) => new Date(val)),
  location: z.string().min(1, "Event location is required"),
  points: z.number().min(0, "Points must be 0 or greater"),
});

export const insertEventAttendanceSchema = createInsertSchema(eventAttendance).omit({
  id: true,
  submittedAt: true,
  approvedAt: true,
  approvedBy: true,
  status: true,
}).extend({
  eventId: z.string().min(1, "Event ID is required"),
  fullName: z.string().min(1, "Full name is required"),
  ufid: z.string().regex(/^\d{8}$/, "UFID must be exactly 8 digits"),
  photo: z.string().optional(),
});

// Types
export type Team = typeof teams.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type AdditionalTeamSignup = typeof additionalTeamSignups.$inferSelect;
export type ProjectRequest = typeof projectRequests.$inferSelect;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type Absence = typeof absences.$inferSelect;
export type Event = typeof events.$inferSelect;
export type EventAttendance = typeof eventAttendance.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertAdditionalTeamSignup = z.infer<typeof insertAdditionalTeamSignupSchema>;
export type InsertProjectRequest = z.infer<typeof insertProjectRequestSchema>;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type InsertAbsence = z.infer<typeof insertAbsenceSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertEventAttendance = z.infer<typeof insertEventAttendanceSchema>;

export type PrintSubmission = typeof printSubmissions.$inferSelect;

export const insertPrintSubmissionSchema = createInsertSchema(printSubmissions).omit({
  id: true,
  timestamp: true,
  status: true,
  progress: true,
  submittedAt: true,
  updatedAt: true,
}).extend({
  submitterName: z.string().min(1, "Submitter name is required"),
  emailAddress: z.string().email("Valid email address is required"),
  requestType: z.string().min(1, "Request type is required"),
  teamName: z.string().optional(),
  color: z.string().min(1, "Color is required"),
  uploadFiles: z.string().optional(),
  generalPrintDescription: z.string().optional(),
  fileSpecifications: z.string().optional(),
  comments: z.string().optional(),
  deadline: z.union([z.string(), z.date()]).transform((val) => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  })
});

export const insertSpecialRoleSchema = createInsertSchema(specialRoles).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  responsibilities: z.string().optional(),
  requirements: z.string().optional(),
});

export const insertRoleApplicationSchema = createInsertSchema(roleApplications).omit({
  id: true,
  status: true,
  reviewedBy: true,
  reviewNotes: true,
  submittedAt: true,
  reviewedAt: true,
}).extend({
  roleId: z.string().min(1, "Role ID is required"),
  applicantName: z.string().min(1, "Applicant name is required"),
  applicantEmail: z.string().email("Valid email address is required"),
  ufid: z.string().regex(/^\d{8}$/, "UFID must be exactly 8 digits"),
  currentTeam: z.string().optional(),
  experience: z.string().min(1, "Experience is required"),
  motivation: z.string().min(1, "Motivation is required"),
  availability: z.string().min(1, "Availability is required"),
  additionalInfo: z.string().optional(),
});

export const insertMemberRoleSchema = createInsertSchema(memberRoles).omit({
  id: true,
  assignedAt: true,
}).extend({
  applicationId: z.string().min(1, "Application ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
  assignedBy: z.string().optional(),
});

export const insertMarketingRequestSchema = createInsertSchema(marketingRequests).omit({
  id: true,
  submittedAt: true,
}).extend({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email address is required"),
  organization: z.string().optional(),
  requestType: z.string().min(1, "Request type is required"),
  message: z.string().min(1, "Message is required"),
});

// Auth Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
}).extend({
  email: z.string().email("Valid email address is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["admin", "member"]).default("member"),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email address is required"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email("Valid email address is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signupSchema = z.object({
  email: z.string().email("Valid email address is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["admin", "president", "captain", "project_manager", "printer_manager", "recipient_coordinator", "outreach_coordinator", "marketing_coordinator", "art_coordinator", "member"]).default("member"),
  adminCode: z.string().min(1, "Admin signup code is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type InsertPrintSubmission = z.infer<typeof insertPrintSubmissionSchema>;
export type SpecialRole = typeof specialRoles.$inferSelect;
export type RoleApplication = typeof roleApplications.$inferSelect;
export type MemberRole = typeof memberRoles.$inferSelect;
export type MarketingRequest = typeof marketingRequests.$inferSelect;
export type InsertSpecialRole = z.infer<typeof insertSpecialRoleSchema>;
export type InsertRoleApplication = z.infer<typeof insertRoleApplicationSchema>;
export type InsertMemberRole = z.infer<typeof insertMemberRoleSchema>;
export type InsertMarketingRequest = z.infer<typeof insertMarketingRequestSchema>;

// News Types
export type NewsStory = typeof newsStories.$inferSelect;
export type NewsApproval = typeof newsApprovals.$inferSelect;

export const insertNewsStorySchema = createInsertSchema(newsStories).omit({
  id: true,
  status: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(1, "Title is required").max(200, "Title must be under 200 characters"),
  content: z.string().optional(),
  summary: z.string().optional(),
  type: z.enum(["story", "event", "link", "announcement"]),
  imageUrl: z.string().url().optional().or(z.literal("")),
  linkUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).optional().default([]),
  authorId: z.string().min(1, "Author ID is required"),
  publishDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

export const insertNewsApprovalSchema = createInsertSchema(newsApprovals).omit({
  id: true,
  createdAt: true,
}).extend({
  storyId: z.string().min(1, "Story ID is required"),
  approverId: z.string().min(1, "Approver ID is required"),
  approved: z.boolean(),
  comments: z.string().optional(),
});

export type InsertNewsStory = z.infer<typeof insertNewsStorySchema>;
export type InsertNewsApproval = z.infer<typeof insertNewsApprovalSchema>;

// Auth Types
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type AdminSignupCode = typeof adminSignupCodes.$inferSelect;
export type InviteCode = typeof inviteCodes.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;