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
  assignTeamsAutomatically(): Promise<void>;
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
    return await db.select().from(applications).orderBy(asc(applications.submittedAt));
  }

  async getApplicationById(id: string): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application || undefined;
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db.insert(applications).values(insertApplication).returning();
    return application;
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
    const [application] = await db.update(applications).set(updates).where(eq(applications.id, id)).returning();
    return application;
  }

  async getApplicationsByTeam(teamId: string): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.assignedTeamId, teamId));
  }

  async getAdditionalTeamSignups(): Promise<AdditionalTeamSignup[]> {
    return await db.select().from(additionalTeamSignups).orderBy(desc(additionalTeamSignups.submittedAt));
  }

  async createAdditionalTeamSignup(insertSignup: InsertAdditionalTeamSignup): Promise<AdditionalTeamSignup> {
    const [signup] = await db.insert(additionalTeamSignups).values(insertSignup).returning();
    return signup;
  }

  async getProjectRequests(): Promise<ProjectRequest[]> {
    return await db.select().from(projectRequests).orderBy(desc(projectRequests.submittedAt));
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

  async assignTeamsAutomatically(): Promise<void> {
    // Get all pending applications ordered by submission time (first-come, first-served)
    const pendingApplications = await db
      .select()
      .from(applications)
      .where(eq(applications.status, "pending"))
      .orderBy(asc(applications.submittedAt));

    // Get all teams with their current sizes
    const allTeams = await this.getTeams();
    const teamCapacities = new Map(allTeams.map(team => [team.id, team.maxCapacity - team.currentSize]));

    for (const application of pendingApplications) {
      if (!application.preferredTeamId) continue;

      const availableSlots = teamCapacities.get(application.preferredTeamId) || 0;
      
      if (availableSlots > 0) {
        // Assign to preferred team
        await this.updateApplication(application.id, {
          assignedTeamId: application.preferredTeamId,
          status: "assigned"
        });

        // Update team capacity
        const team = allTeams.find(t => t.id === application.preferredTeamId);
        if (team) {
          await this.updateTeam(team.id, {
            currentSize: team.currentSize + 1
          });
          teamCapacities.set(team.id, availableSlots - 1);
        }
      } else {
        // Add to waitlist
        await this.updateApplication(application.id, {
          status: "waitlisted"
        });
      }
    }
  }
}

export const storage = new DatabaseStorage();
