import { 
  teams, applications, additionalTeamSignups, projectRequests, adminSettings, absences, events, eventAttendance,
  type Team, type Application, type AdditionalTeamSignup, type ProjectRequest, type AdminSetting, type Absence, type Event, type EventAttendance,
  type InsertTeam, type InsertApplication, type InsertAdditionalTeamSignup, type InsertProjectRequest, type InsertAdminSetting, type InsertAbsence, type InsertEvent, type InsertEventAttendance
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, isNull, sql, or } from "drizzle-orm";

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

  // Events
  getEvents(): Promise<Event[]>;
  getEventById(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, updates: Partial<Event>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;

  // Event Attendance
  getEventAttendance(): Promise<EventAttendance[]>;
  getEventAttendanceById(id: string): Promise<EventAttendance | undefined>;
  createEventAttendance(attendance: InsertEventAttendance): Promise<EventAttendance>;
  getEventAttendancesByEvent(eventId: string): Promise<EventAttendance[]>;
  approveEventAttendance(id: string): Promise<{ message: string; pointsAdded?: number }>;
  rejectEventAttendance(id: string): Promise<void>;
  deleteEventAttendance(id: string): Promise<void>;
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

    const applicationData = {
      fullName: insertApplication.fullName,
      firstName: insertApplication.firstName,
      lastName: insertApplication.lastName,
      email: insertApplication.email,
      ufid: insertApplication.ufid,
      teamPreferences: insertApplication.teamPreferences,
      additionalTeams: insertApplication.additionalTeams || [],
      skills: insertApplication.skills || [],
      additionalSkills: insertApplication.additionalSkills,
      timeAvailability: insertApplication.timeAvailability,
      acknowledgments: insertApplication.acknowledgments,
    };

    const [application] = await db.insert(applications).values(applicationData as any).returning();
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
      .where(eq(applications.status, "assigned"))
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

  async assignTeamsAutomatically(): Promise<{ assignments: Array<{ applicationId: string; studentName: string; assignedTeam: string | null; reason: string }>, logFileContent: string }> {
    console.log(`[AUTO-ASSIGN] Starting automatic team assignment process...`);

    // Initialize detailed logging
    const assignmentLog: string[] = [];
    const timestamp = new Date().toISOString();

    assignmentLog.push(`GRiP Team Assignment Report`);
    assignmentLog.push(`Generated: ${new Date(timestamp).toLocaleString()}`);
    assignmentLog.push(`=`.repeat(80));
    assignmentLog.push(``);

    // Get all pending applications - no separate "accepted" status anymore
    const pendingApplications = await db
      .select()
      .from(applications)
      .where(eq(applications.status, "pending"))
      .orderBy(asc(applications.submittedAt));

    console.log(`[AUTO-ASSIGN] Found ${pendingApplications.length} pending applications to process`);
    assignmentLog.push(`ASSIGNMENT OVERVIEW`);
    assignmentLog.push(`Total pending applications to process: ${pendingApplications.length}`);
    assignmentLog.push(`Assignment method: First-come, first-served based on submission timestamp`);
    assignmentLog.push(``);

    // Process all pending applications
    const allApplicationsToProcess = pendingApplications;

    // Get technical teams only for assignment
    const allTeams = await this.getTeams();
    const technicalTeams = allTeams.filter(team => team.type === 'technical');
    const teamCapacities = new Map(technicalTeams.map(team => [team.id, { 
      name: team.name, 
      available: team.maxCapacity - team.currentSize,
      maxCapacity: team.maxCapacity,
      currentSize: team.currentSize
    }]));

    console.log(`[AUTO-ASSIGN] Technical teams available for assignment:`);
    assignmentLog.push(`TECHNICAL TEAMS CAPACITY (BEFORE ASSIGNMENT)`);
    technicalTeams.forEach(team => {
      const capacity = teamCapacities.get(team.id);
      console.log(`  - ${team.name}: ${capacity?.available}/${capacity?.maxCapacity} slots available`);
      assignmentLog.push(`${team.name}: ${capacity?.available}/${capacity?.maxCapacity} slots available`);
    });
    assignmentLog.push(``);

    const assignments: Array<{ applicationId: string; studentName: string; assignedTeam: string | null; reason: string }> = [];

    assignmentLog.push(`INDIVIDUAL ASSIGNMENT DETAILS`);
    assignmentLog.push(`=`.repeat(50));
    assignmentLog.push(``);

    for (const application of allApplicationsToProcess) {
      console.log(`[AUTO-ASSIGN] Processing ${application.fullName} (${application.status})`);

      assignmentLog.push(`Processing: ${application.fullName}`);
      assignmentLog.push(`Email: ${application.email}`);
      assignmentLog.push(`UFID: ${application.ufid}`);
      assignmentLog.push(`Submission Time: ${new Date(application.submittedAt).toLocaleString()}`);
      assignmentLog.push(`Current Status: ${application.status}`);

      let assignedTeamId: string | null = null;
      let reason = "";

      // Check if application has complete information
      if (!application.teamPreferences || application.teamPreferences.length === 0) {
        reason = "No team preferences provided - moved to waitlist";
        console.log(`[AUTO-ASSIGN] ${application.fullName}: ${reason}`);
        assignmentLog.push(`❌ VALIDATION FAILED: No team preferences provided`);
        assignmentLog.push(`⚠️  RESULT: Moved to waitlist`);
        assignmentLog.push(`📝 Reason: ${reason}`);
        assignmentLog.push(``);

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
        console.log(`[AUTO-ASSIGN] ${application.fullName}: ${reason}`);
        assignmentLog.push(`❌ VALIDATION FAILED: No time availability provided`);
        assignmentLog.push(`⚠️  RESULT: Moved to waitlist`);
        assignmentLog.push(`📝 Reason: ${reason}`);
        assignmentLog.push(``);

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

      // Log application details for successful validation
      assignmentLog.push(`✅ VALIDATION PASSED`);
      assignmentLog.push(`Team Preferences: ${application.teamPreferences.length} teams selected`);
      assignmentLog.push(`Time Availability: ${application.timeAvailability.length} time slots available`);
      assignmentLog.push(`Skills: ${Array.isArray(application.skills) ? application.skills.join(', ') : 'None specified'}`);
      assignmentLog.push(``);

      // Try to assign based on team preferences (in order of preference)
      // Filter team preferences to only include technical teams
      const technicalTeamPreferences = application.teamPreferences.filter(teamId => 
        technicalTeams.some(team => team.id === teamId)
      );

      console.log(`[AUTO-ASSIGN] ${application.fullName} preferences: ${technicalTeamPreferences.length} technical teams`);
      assignmentLog.push(`TEAM PREFERENCE MATCHING PROCESS`);
      assignmentLog.push(`Technical team preferences found: ${technicalTeamPreferences.length}`);

      // Log all preferences
      assignmentLog.push(`Preference order:`);
      technicalTeamPreferences.forEach((teamId, index) => {
        const team = technicalTeams.find(t => t.id === teamId);
        assignmentLog.push(`  ${index + 1}. ${team?.name || 'Unknown Team'} (ID: ${teamId})`);
      });
      assignmentLog.push(``);

      for (let i = 0; i < technicalTeamPreferences.length; i++) {
        const preferredTeamId = technicalTeamPreferences[i];
        const teamCapacity = teamCapacities.get(preferredTeamId);

        if (!teamCapacity) {
          console.log(`[AUTO-ASSIGN] ${application.fullName}: Preference #${i + 1} team not found or not technical`);
          assignmentLog.push(`❌ Preference #${i + 1}: Team not found or not technical (ID: ${preferredTeamId})`);
          continue; // Team doesn't exist or isn't technical
        }

        console.log(`[AUTO-ASSIGN] ${application.fullName}: Checking preference #${i + 1}: ${teamCapacity.name} (${teamCapacity.available} slots available)`);
        assignmentLog.push(`🔍 Checking Preference #${i + 1}: ${teamCapacity.name}`);
        assignmentLog.push(`   Current capacity: ${teamCapacity.currentSize}/${teamCapacity.maxCapacity}`);
        assignmentLog.push(`   Available slots: ${teamCapacity.available}`);

        if (teamCapacity.available > 0) {
          assignedTeamId = preferredTeamId;
          reason = `Assigned to preference #${i + 1}: ${teamCapacity.name} (${teamCapacity.available} slots available)`;

          console.log(`[AUTO-ASSIGN] SUCCESS: ${application.fullName} assigned to ${teamCapacity.name}`);
          assignmentLog.push(`✅ SUCCESS: Matched with ${teamCapacity.name}!`);
          assignmentLog.push(`🎯 Assignment Details:`);
          assignmentLog.push(`   - Preference rank: #${i + 1}`);
          assignmentLog.push(`   - Team: ${teamCapacity.name}`);
          assignmentLog.push(`   - Slots before assignment: ${teamCapacity.available}`);
          assignmentLog.push(`   - New team size: ${teamCapacity.currentSize + 1}/${teamCapacity.maxCapacity}`);

          // Update application status to assigned (consolidating assigned and accepted)
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

          console.log(`[AUTO-ASSIGN] Updated ${teamCapacity.name} capacity: ${teamCapacity.available - 1}/${teamCapacity.maxCapacity} slots remaining`);

          // Handle additional teams - auto-assign to any additional teams they selected
          if (application.additionalTeams && application.additionalTeams.length > 0) {
            console.log(`[AUTO-ASSIGN] Processing ${application.additionalTeams.length} additional teams for ${application.fullName}`);
            assignmentLog.push(`📋 Additional Teams Processing:`);
            assignmentLog.push(`   - Additional teams selected: ${application.additionalTeams.length}`);
            await this.assignToAdditionalTeams(application.id, application.additionalTeams);
            assignmentLog.push(`   - Additional teams processed successfully`);
          }

          assignmentLog.push(``);
          break;
        } else {
          console.log(`[AUTO-ASSIGN] ${application.fullName}: ${teamCapacity.name} is full (${teamCapacity.currentSize}/${teamCapacity.maxCapacity})`);
          assignmentLog.push(`❌ ${teamCapacity.name} is FULL (${teamCapacity.currentSize}/${teamCapacity.maxCapacity})`);
        }
      }

      // If no preferred teams available, add to waitlist
      if (!assignedTeamId) {
        const preferredTeamNames = technicalTeamPreferences
          .map(id => teamCapacities.get(id)?.name || "Unknown")
          .join(", ");
        reason = `All preferred technical teams full: ${preferredTeamNames} - moved to waitlist`;

        console.log(`[AUTO-ASSIGN] WAITLISTED: ${application.fullName} - ${reason}`);
        assignmentLog.push(`⚠️  RESULT: WAITLISTED`);
        assignmentLog.push(`📝 Reason: All preferred teams are at full capacity`);
        assignmentLog.push(`   Preferred teams checked: ${preferredTeamNames}`);

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

      assignmentLog.push(`${'='.repeat(60)}`);
      assignmentLog.push(``);
    }

    console.log(`[AUTO-ASSIGN] Assignment process completed!`);
    console.log(`[AUTO-ASSIGN] Summary: ${assignments.length} applications processed`);
    console.log(`[AUTO-ASSIGN] Assigned: ${assignments.filter(a => a.assignedTeam !== null).length}`);
    console.log(`[AUTO-ASSIGN] Waitlisted: ${assignments.filter(a => a.assignedTeam === null).length}`);

    // Add final summary to log
    assignmentLog.push(`ASSIGNMENT SUMMARY`);
    assignmentLog.push(`=`.repeat(30));
    assignmentLog.push(`Total applications processed: ${assignments.length}`);
    assignmentLog.push(`Successfully assigned: ${assignments.filter(a => a.assignedTeam !== null).length}`);
    assignmentLog.push(`Waitlisted: ${assignments.filter(a => a.assignedTeam === null).length}`);
    assignmentLog.push(``);

    // Log final team capacities
    console.log(`[AUTO-ASSIGN] Final team capacities:`);
    assignmentLog.push(`FINAL TEAM CAPACITIES`);
    assignmentLog.push(`=`.repeat(30));
    Array.from(teamCapacities.entries()).forEach(([teamId, capacity]) => {
      console.log(`  - ${capacity.name}: ${capacity.maxCapacity - capacity.available}/${capacity.maxCapacity} filled`);
      assignmentLog.push(`${capacity.name}: ${capacity.maxCapacity - capacity.available}/${capacity.maxCapacity} filled`);
    });

    assignmentLog.push(``);
    assignmentLog.push(`Report generated at: ${new Date().toLocaleString()}`);
    assignmentLog.push(`=`.repeat(80));

    const logFileContent = assignmentLog.join('\n');

    return { assignments, logFileContent };
  }

  private async assignToAdditionalTeams(applicationId: string, additionalTeamIds: string[]): Promise<void> {
    console.log(`[AUTO-ASSIGN] Processing additional teams for application ${applicationId}: ${additionalTeamIds.length} teams`);

    // Get application details for signup creation
    const application = await this.getApplicationById(applicationId);
    if (!application) {
      console.log(`[AUTO-ASSIGN] ERROR: Application ${applicationId} not found for additional team assignment`);
      return;
    }

    // Get constant teams for additional assignments
    const allTeams = await this.getTeams();
    const constantTeams = allTeams.filter(team => team.type === 'constant');

    for (const teamId of additionalTeamIds) {
      const team = constantTeams.find(t => t.id === teamId);
      if (team && team.currentSize < team.maxCapacity) {
        console.log(`[AUTO-ASSIGN] Adding ${application.fullName} to additional team: ${team.name}`);

        try {
          // Create additional team signup record with proper fields
          await this.createAdditionalTeamSignup({
            fullName: application.fullName,
            email: application.email,
            ufid: application.ufid,
            selectedTeams: [teamId]
          });

          // Update team size
          await this.updateTeam(teamId, {
            currentSize: team.currentSize + 1
          });

          console.log(`[AUTO-ASSIGN] Successfully added to ${team.name}, new size: ${team.currentSize + 1}/${team.maxCapacity}`);
        } catch (error) {
          console.error(`[AUTO-ASSIGN] ERROR: Failed to add ${application.fullName} to team ${team.name}:`, error);
        }
      } else if (team) {
        console.log(`[AUTO-ASSIGN] Skipping additional team ${team.name} - at capacity (${team.currentSize}/${team.maxCapacity})`);
      } else {
        console.log(`[AUTO-ASSIGN] WARNING: Additional team ${teamId} not found or not constant type`);
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

  async createAbsence(insertAbsence: InsertAbsence): Promise<Absence> {
    const [absence] = await db.insert(absences).values({
      ...insertAbsence,
      startDate: new Date(insertAbsence.startDate),
    }).returning();
    return absence;
  }

  async getAbsences(): Promise<Absence[]> {
    return await db.select().from(absences)
      .where(eq(absences.isActive, true))
      .orderBy(desc(absences.createdAt));
  }

  async getAbsencesByApplication(applicationId: string): Promise<Absence[]> {
    return await db.select().from(absences)
      .where(and(eq(absences.applicationId, applicationId), eq(absences.isActive, true)))
      .orderBy(desc(absences.startDate));
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

  // Events
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.createdAt));
  }

  async getEventById(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const [event] = await db.update(events).set(updates).where(eq(events.id, id)).returning();
    return event;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Event Attendance
  async getEventAttendance(): Promise<EventAttendance[]> {
    try {
      const attendanceRecords = await db
        .select({
          id: eventAttendance.id,
          eventId: eventAttendance.eventId,
          fullName: eventAttendance.fullName,
          ufid: eventAttendance.ufid,
          photo: eventAttendance.photo,
          socialMediaPermission: eventAttendance.socialMediaPermission,
          status: eventAttendance.status,
          submittedAt: eventAttendance.submittedAt,
          approvedAt: eventAttendance.approvedAt,
          approvedBy: eventAttendance.approvedBy,
          event: events
        })
        .from(eventAttendance)
        .leftJoin(events, eq(eventAttendance.eventId, events.id))
        .orderBy(desc(eventAttendance.createdAt));

      return attendanceRecords.map(record => ({
        id: record.id,
        eventId: record.eventId,
        fullName: record.fullName,
        ufid: record.ufid,
        photo: record.photo,
        socialMediaPermission: record.socialMediaPermission,
        status: record.status,
        submittedAt: record.submittedAt,
        approvedAt: record.approvedAt,
        approvedBy: record.approvedBy,
        event: record.event
      }));
    } catch (error) {
      console.error("Error fetching event attendance:", error);
      return [];
    }
  }

  async getEventAttendanceById(id: string): Promise<EventAttendance | undefined> {
    const [attendance] = await db.select().from(eventAttendance).where(eq(eventAttendance.id, id));
    return attendance || undefined;
  }

  async createEventAttendance(insertAttendance: InsertEventAttendance): Promise<EventAttendance> {
    const [attendance] = await db.insert(eventAttendance).values(insertAttendance).returning();
    return attendance;
  }

    async getEventAttendancesByEvent(eventId: string): Promise<EventAttendance[]> {
    return await db.select().from(eventAttendance).where(eq(eventAttendance.eventId, eventId));
  }

  async approveEventAttendance(id: string): Promise<{ message: string; pointsAdded?: number }> {
    // Get the attendance record with event details
    const [attendance] = await db
      .select({
        attendance: eventAttendance,
        event: events
      })
      .from(eventAttendance)
      .leftJoin(events, eq(eventAttendance.eventId, events.id))
      .where(eq(eventAttendance.id, id));

    if (!attendance) {
      throw new Error("Attendance record not found");
    }

    // Update attendance status
    await db.update(eventAttendance)
      .set({ 
        status: "approved", 
        approvedAt: new Date(),
        approvedBy: "Admin" 
      })
      .where(eq(eventAttendance.id, id));

    // Find the user's application and add points
    if (attendance.event) {
      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.ufid, attendance.attendance.ufid))
        .limit(1);

      if (application) {
        // Add points to user
        const newPoints = application.points + attendance.event.points;
        
        // Add event to user's events array
        const userEvents = Array.isArray(application.events) ? application.events : [];
        if (!userEvents.includes(attendance.event.id)) {
          userEvents.push(attendance.event.id);
        }

        await db.update(applications)
          .set({ 
            points: newPoints,
            events: userEvents
          })
          .where(eq(applications.id, application.id));

        return { 
          message: `Attendance approved! ${attendance.event.points} points added to ${attendance.attendance.fullName}`,
          pointsAdded: attendance.event.points
        };
      }
    }

    return { message: "Attendance approved" };
  }

  async rejectEventAttendance(id: string): Promise<void> {
    await db.update(eventAttendance)
      .set({ status: "rejected" })
      .where(eq(eventAttendance.id, id));
  }

  async deleteEventAttendance(id: string): Promise<void> {
    await db.delete(eventAttendance).where(eq(eventAttendance.id, id));
  }
}

export const storage = new DatabaseStorage();