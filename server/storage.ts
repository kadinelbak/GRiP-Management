import { 
  teams, applications, additionalTeamSignups, projectRequests, adminSettings, absences,
  type Team, type Application, type AdditionalTeamSignup, type ProjectRequest, type AdminSetting, type Absence,
  type InsertTeam, type InsertApplication, type InsertAdditionalTeamSignup, 
  type InsertProjectRequest, type InsertAdminSetting, type InsertAbsence
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, isNull, sql } from "drizzle-orm";

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
  getAcceptedMembers(): Promise<Application[]>;
  addAbsence(applicationId: string, startDate: string, reason?: string): Promise<void>;
  removeAbsence(absenceId: string): Promise<void>;
  getAbsences(): Promise<Absence[]>;
  createAbsence(absence: InsertAbsence): Promise<Absence>;
  getAbsencesByApplication(applicationId: string): Promise<Absence[]>;
  clearAbsence(id: string): Promise<void>;
  clearAllAbsencesForUser(applicationId: string): Promise<void>;

  // Additional Team Signups
  getAdditionalTeamSignups(): Promise<AdditionalTeamSignup[]>;
  createAdditionalTeamSignup(signup: InsertAdditionalTeamSignup): Promise<AdditionalTeamSignup>;
  deleteAdditionalTeamSignup(id: string): Promise<void>;

  // Project Requests
  getProjectRequests(): Promise<ProjectRequest[]>;
  getProjectRequestById(id: string): Promise<ProjectRequest | undefined>;
  createProjectRequest(request: InsertProjectRequest): Promise<ProjectRequest>;
  updateProjectRequest(id: string, updates: Partial<ProjectRequest>): Promise<ProjectRequest>;
  deleteProjectRequest(id: string): Promise<void>;

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
    try {
      // First, remove any absences for this application
      await db.delete(absences).where(eq(absences.applicationId, id));

      // Then delete the application itself
      await db.delete(applications).where(eq(applications.id, id));

      return;
    } catch (error) {
      console.error("Error deleting application:", error);
      throw error;
    }
  }

  async getApplicationsByTeam(teamId: string): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.assignedTeamId, teamId));
  }

  async getAcceptedMembers(): Promise<Application[]> {
    const members = await db
      .select({
        application: applications,
        absences: absences,
      })
      .from(applications)
      .leftJoin(absences, and(eq(applications.id, absences.applicationId), eq(absences.isActive, true)))
      .where(eq(applications.status, "accepted"))
      .orderBy(asc(applications.fullName));

    // Group absences by application
    const membersMap = new Map();
    members.forEach(({ application, absences: absence }) => {
      if (!membersMap.has(application.id)) {
        membersMap.set(application.id, { ...application, absences: [] });
      }
      if (absence) {
        membersMap.get(application.id).absences.push(absence);
      }
    });

    return Array.from(membersMap.values());
  }

  async addAbsence(applicationId: string, startDate: string, reason?: string): Promise<void> {
    await db.insert(absences).values({
      applicationId,
      startDate: new Date(startDate),
      reason: reason || null,
    });
  }

  async removeAbsence(absenceId: string): Promise<void> {
    await db.delete(absences).where(eq(absences.id, absenceId));
  }

  async getAbsences(): Promise<Absence[]> {
    return await db.select().from(absences).orderBy(desc(absences.createdAt));
  }

  async createAbsence(insertAbsence: InsertAbsence): Promise<Absence> {
    const [absence] = await db.insert(absences).values({
      ...insertAbsence,
      startDate: new Date(insertAbsence.startDate),
    }).returning();
    return absence;
  }

  async getAbsencesByApplication(applicationId: string): Promise<Absence[]> {
    return await db.select().from(absences)
      .where(and(eq(absences.applicationId, applicationId), eq(absences.isActive, true)))
      .orderBy(desc(absences.startDate));
  }

  async clearAbsence(id: string): Promise<void> {
    await db.delete(absences).where(eq(absences.id, id));
  }

  async clearAllAbsencesForUser(applicationId: string): Promise<void> {
    await db.delete(absences).where(eq(absences.applicationId, applicationId));
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

  async deleteAdditionalTeamSignup(id: string): Promise<void> {
    await db.delete(additionalTeamSignups).where(eq(additionalTeamSignups.id, id));
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

  async deleteProjectRequest(id: string): Promise<void> {
    await db.delete(projectRequests).where(eq(projectRequests.id, id));
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
    // Get accepted unassigned members first (priority), then pending applications
    const acceptedUnassigned = await db
      .select()
      .from(applications)
      .where(and(eq(applications.status, "accepted"), isNull(applications.assignedTeamId)))
      .orderBy(asc(applications.submittedAt));

    const pendingApplications = await db
      .select()
      .from(applications)
      .where(eq(applications.status, "pending"))
      .orderBy(asc(applications.submittedAt));

    // Combine with priority: accepted unassigned first, then pending
    const allApplicationsToProcess = [...acceptedUnassigned, ...pendingApplications];

    // Get technical teams only for assignment
    const allTeams = await this.getTeams();
    const technicalTeams = allTeams.filter(team => team.type === 'technical');
    const teamCapacities = new Map(technicalTeams.map(team => [team.id, { 
      name: team.name, 
      available: team.maxCapacity - team.currentSize,
      maxCapacity: team.maxCapacity,
      currentSize: team.currentSize
    }]));

    const assignments: Array<{ applicationId: string; studentName: string; assignedTeam: string | null; reason: string }> = [];

    for (const application of allApplicationsToProcess) {
      let assignedTeamId: string | null = null;
      let reason = "";
      const isAcceptedMember = application.status === "accepted";

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
      // Filter team preferences to only include technical teams
      const technicalTeamPreferences = application.teamPreferences.filter(teamId => 
        technicalTeams.some(team => team.id === teamId)
      );

      for (let i = 0; i < technicalTeamPreferences.length; i++) {
        const preferredTeamId = technicalTeamPreferences[i];
        const teamCapacity = teamCapacities.get(preferredTeamId);

        if (!teamCapacity) {
          continue; // Team doesn't exist or isn't technical
        }

        if (teamCapacity.available > 0) {
          assignedTeamId = preferredTeamId;
          const memberType = isAcceptedMember ? "accepted member" : "new applicant";
          reason = `${memberType} assigned to preference #${i + 1}: ${teamCapacity.name} (${teamCapacity.available} slots available)`;

          // Update application - if they were accepted and unassigned, keep them accepted
          // If they were pending, mark as assigned
          const newStatus = isAcceptedMember ? "accepted" : "assigned";

          await this.updateApplication(application.id, {
            assignedTeamId,
            status: newStatus,
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

          // Handle additional teams - auto-assign to any additional teams they selected
          if (application.additionalTeams && application.additionalTeams.length > 0) {
            await this.assignToAdditionalTeams(application.id, application.additionalTeams);
          }

          break;
        }
      }

      // If no preferred teams available, add to waitlist
      if (!assignedTeamId) {
        const preferredTeamNames = technicalTeamPreferences
          .map(id => teamCapacities.get(id)?.name || "Unknown")
          .join(", ");
        reason = `All preferred technical teams full: ${preferredTeamNames} - moved to waitlist`;

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

  private async assignToAdditionalTeams(applicationId: string, additionalTeamIds: string[]): Promise<void> {
    // Get constant teams for additional assignments
    const allTeams = await this.getTeams();
    const constantTeams = allTeams.filter(team => team.type === 'constant');

    for (const teamId of additionalTeamIds) {
      const team = constantTeams.find(t => t.id === teamId);
      if (team && team.currentSize < team.maxCapacity) {
        // Create additional team signup record
        await this.createAdditionalTeamSignup({
          applicationId,
          teamId,
          submittedAt: new Date()
        });

        // Update team size
        await this.updateTeam(teamId, {
          currentSize: team.currentSize + 1
        });
      }
    }
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