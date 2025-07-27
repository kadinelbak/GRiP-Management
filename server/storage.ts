import { 
  teams, applications, additionalTeamSignups, projectRequests, adminSettings,
  type Team, type Application, type AdditionalTeamSignup, type ProjectRequest, type AdminSetting,
  type InsertTeam, type InsertApplication, type InsertAdditionalTeamSignup, 
  type InsertProjectRequest, type InsertAdminSetting
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and } from "drizzle-orm";

export interface IStorage {
  // Teams
  getTeams(): Promise<Team[]>;
  getTeamById(id: string): Promise<Team | undefined>;
  getTeamsByType(type: string): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, updates: Partial<Team>): Promise<Team>;
  deleteTeam(id: string): Promise<void>;

  // Applications
  getApplications(): Promise<Application[]>;
  getApplicationById(id: string): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, updates: Partial<Application>): Promise<Application>;
  getApplicationsByTeam(teamId: string): Promise<Application[]>;
  deleteApplication(id: string): Promise<void>;

  // Additional Team Signups
  getAdditionalTeamSignups(): Promise<AdditionalTeamSignup[]>;
  createAdditionalTeamSignup(signup: InsertAdditionalTeamSignup): Promise<AdditionalTeamSignup>;

  // Project Requests
  getProjectRequests(): Promise<ProjectRequest[]>;
  getProjectRequestById(id: string): Promise<ProjectRequest | undefined>;
  createProjectRequest(request: InsertProjectRequest): Promise<ProjectRequest>;
  updateProjectRequest(id: string, updates: Partial<ProjectRequest>): Promise<ProjectRequest>;

  // Admin Settings
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  setAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting>;
  getAdminSettings(): Promise<AdminSetting[]>;

  // Team Assignment
  assignTeamsAutomatically(): Promise<{ assignments: Array<{ applicationId: string; studentName: string; assignedTeam: string | null; reason: string }> }>;

  // Team membership
  getTeamMembers(teamId: string): Promise<Application[]>;
}

export class DatabaseStorage implements IStorage {
  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams).orderBy(asc(teams.name));
  }

  async getTeamById(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async getTeamsByType(type: string): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.type, type)).orderBy(asc(teams.name));
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(insertTeam).returning();
    return team;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    const [team] = await db.update(teams).set(updates).where(eq(teams.id, id)).returning();
    return team;
  }

  async deleteTeam(id: string): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
  }

  async getApplications(): Promise<Application[]> {
    try {
      return await db.select().from(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      return [];
    }
  }

  async getApplicationById(id: string): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application || undefined;
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    // Check for duplicate UFID in applications
    const existingApplication = await db.select().from(applications).where(eq(applications.ufid, insertApplication.ufid));
    if (existingApplication.length > 0) {
      throw new Error("A technical team application with this UFID already exists. You cannot submit multiple technical team applications.");
    }

    const [application] = await db.insert(applications).values(insertApplication).returning();
    return application;
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
    const [application] = await db.update(applications).set(updates).where(eq(applications.id, id)).returning();
    return application;
  }

  async deleteApplication(id: string): Promise<void> {
    await db.delete(applications).where(eq(applications.id, id));
  }

  async getApplicationsByTeam(teamId: string): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.assignedTeamId, teamId));
  }

  async getAdditionalTeamSignups(): Promise<AdditionalTeamSignup[]> {
    return await db.select().from(additionalTeamSignups).orderBy(desc(additionalTeamSignups.submittedAt));
  }

  async createAdditionalTeamSignup(insertSignup: InsertAdditionalTeamSignup): Promise<AdditionalTeamSignup> {
    // Check for duplicate UFID in additional team signups  
    const existingSignup = await db.select().from(additionalTeamSignups).where(eq(additionalTeamSignups.ufid, insertSignup.ufid));
    if (existingSignup.length > 0) {
      throw new Error("You have already signed up for additional teams with this UFID. You cannot submit multiple additional team signups.");
    }

    const [signup] = await db.insert(additionalTeamSignups).values(insertSignup).returning();
    return signup;
  }

  async getProjectRequests(): Promise<ProjectRequest[]> {
    try {
      return await db.select().from(projectRequests);
    } catch (error) {
      console.error("Error fetching project requests:", error);
      return [];
    }
  }

  async getProjectRequestById(id: string): Promise<ProjectRequest | undefined> {
    const [request] = await db.select().from(projectRequests).where(eq(projectRequests.id, id));
    return request || undefined;
  }

  async createProjectRequest(insertRequest: InsertProjectRequest): Promise<ProjectRequest> {
    const [request] = await db.insert(projectRequests).values(insertRequest).returning();
    return request;
  }

  async updateProjectRequest(id: string, updates: Partial<ProjectRequest>): Promise<ProjectRequest> {
    const [request] = await db.update(projectRequests).set(updates).where(eq(projectRequests.id, id)).returning();
    return request;
  }

  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const [setting] = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
    return setting || undefined;
  }

  async setAdminSetting(insertSetting: InsertAdminSetting): Promise<AdminSetting> {
    const [setting] = await db
      .insert(adminSettings)
      .values(insertSetting)
      .onConflictDoUpdate({
        target: adminSettings.key,
        set: { value: insertSetting.value, updatedAt: new Date() }
      })
      .returning();
    return setting;
  }

  async getAdminSettings(): Promise<AdminSetting[]> {
    return await db.select().from(adminSettings);
  }

  async assignTeamsAutomatically(): Promise<{ assignments: Array<{ applicationId: string; studentName: string; assignedTeam: string | null; reason: string }> }> {
    // Get all pending applications ordered by submission time (first-come, first-served)
    const pendingApplications = await db
      .select()
      .from(applications)
      .where(eq(applications.status, "pending"))
      .orderBy(asc(applications.submittedAt));

    // Get all teams with their current sizes
    const allTeams = await this.getTeams();
    const teamCapacities = new Map(allTeams.map(team => [team.id, { 
      name: team.name, 
      available: team.maxCapacity - team.currentSize,
      maxCapacity: team.maxCapacity,
      currentSize: team.currentSize
    }]));

    const assignments: Array<{ applicationId: string; studentName: string; assignedTeam: string | null; reason: string }> = [];

    for (const application of pendingApplications) {
      let assignedTeamId: string | null = null;
      let reason = "";

      // Check if application has complete information
      if (!application.teamPreferences || application.teamPreferences.length === 0) {
        reason = "No team preferences provided - moved to waitlist";
        await this.updateApplication(application.id, {
          status: "waitlisted",
          assignmentReason: reason
        });
        assignments.push({
          applicationId: application.id,
          studentName: application.fullName,
          assignedTeam: null,
          reason
        });
        continue;
      }

      if (!application.timeAvailability || application.timeAvailability.length === 0) {
        reason = "No time availability provided - moved to waitlist";
        await this.updateApplication(application.id, {
          status: "waitlisted",
          assignmentReason: reason
        });
        assignments.push({
          applicationId: application.id,
          studentName: application.fullName,
          assignedTeam: null,
          reason
        });
        continue;
      }

      // Try to assign based on team preferences (in order of preference)
      for (let i = 0; i < application.teamPreferences.length; i++) {
        const preferredTeamId = application.teamPreferences[i];
        const teamCapacity = teamCapacities.get(preferredTeamId);

        if (!teamCapacity) {
          continue; // Team doesn't exist
        }

        if (teamCapacity.available > 0) {
          assignedTeamId = preferredTeamId;
          reason = `Assigned to preference #${i + 1}: ${teamCapacity.name} (${teamCapacity.available} slots available)`;

          // Update application
          await this.updateApplication(application.id, {
            assignedTeamId,
            status: "assigned",
            assignmentReason: reason
          });

          // Update team capacity
          await this.updateTeam(preferredTeamId, {
            currentSize: teamCapacity.currentSize + 1
          });

          // Update our local capacity tracking
          teamCapacities.set(preferredTeamId, {
            ...teamCapacity,
            available: teamCapacity.available - 1,
            currentSize: teamCapacity.currentSize + 1
          });

          break;
        }
      }

      // If no preferred teams available, add to waitlist
      if (!assignedTeamId) {
        const preferredTeamNames = application.teamPreferences
          .map(id => teamCapacities.get(id)?.name || "Unknown")
          .join(", ");
        reason = `All preferred teams full: ${preferredTeamNames} - moved to waitlist`;

        await this.updateApplication(application.id, {
          status: "waitlisted",
          assignmentReason: reason
        });
      }

      assignments.push({
        applicationId: application.id,
        studentName: application.fullName,
        assignedTeam: assignedTeamId ? teamCapacities.get(assignedTeamId)?.name || null : null,
        reason
      });
    }

    return { assignments };
  }

  async getTeamMembers(teamId: string): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.assignedTeamId, teamId));
  }

  async removeUserFromTeam(applicationId: string): Promise<void> {
    const application = await db.select().from(applications).where(eq(applications.id, applicationId)).limit(1);
    
    if (application.length > 0 && application[0].assignedTeamId) {
      const teamId = application[0].assignedTeamId;
      
      // Remove user from team
      await db.update(applications)
        .set({ 
          assignedTeamId: null, 
          status: "pending",
          assignmentReason: null 
        })
        .where(eq(applications.id, applicationId));
      
      // Update team current size
      await db.update(teams)
        .set({ currentSize: sql`${teams.currentSize} - 1` })
        .where(eq(teams.id, teamId));
    }
  }

  async removeAllMembers(): Promise<void> {
    // Reset all applications
    await db.update(applications)
      .set({ 
        assignedTeamId: null, 
        status: "pending",
        assignmentReason: null 
      });
    
    // Reset all team sizes
    await db.update(teams)
      .set({ currentSize: 0 });

    // Clear all absences
    await db.delete(absences);
  }

  async createAbsence(absenceData: any): Promise<Absence> {
    const [absence] = await db.insert(absences).values({
      ...absenceData,
      startDate: new Date(absenceData.startDate),
      endDate: absenceData.endDate ? new Date(absenceData.endDate) : null,
    }).returning();
    return absence;
  }

  async getAbsences(): Promise<Absence[]> {
    return await db.select().from(absences).orderBy(desc(absences.createdAt));
  }

  async getAbsencesByApplication(applicationId: string): Promise<Absence[]> {
    return await db.select().from(absences)
      .where(and(eq(absences.applicationId, applicationId), eq(absences.isActive, true)));
  }

  async clearAbsence(absenceId: string): Promise<void> {
    await db.update(absences)
      .set({ isActive: false })
      .where(eq(absences.id, absenceId));
  }

  async clearAllAbsencesForUser(applicationId: string): Promise<void> {
    await db.update(absences)
      .set({ isActive: false })
      .where(eq(absences.applicationId, applicationId));
  }
}

export const storage = new DatabaseStorage();