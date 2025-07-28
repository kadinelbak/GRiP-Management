
import { db } from "./db";
import { teams, applications, additionalTeamSignups } from "@shared/schema";
import { sql } from "drizzle-orm";

async function seedDummyData() {
  try {
    console.log("Starting database cleanup and seeding...");
    
    // Clear existing data in the correct order to handle foreign key constraints
    await db.delete(additionalTeamSignups);
    
    // Delete absences first (they reference applications)
    await db.execute(sql`DELETE FROM absences`);
    
    await db.delete(applications);
    await db.delete(teams);
    
    console.log("Cleared existing data");
    
    // Create dummy technical teams
    const technicalTeamsData = [
      {
        name: "3D-Printed Hands Team Alpha",
        type: "technical",
        maxCapacity: 8,
        currentSize: 0,
        meetingTime: "Mondays 6:00 PM - 8:00 PM",
        requiredSkills: "3D Modeling, CAD Design",
        description: "Design and create prosthetic hands using 3D printing technology"
      },
      {
        name: "3D-Printed Hands Team Beta",
        type: "technical", 
        maxCapacity: 8,
        currentSize: 0,
        meetingTime: "Wednesdays 5:00 PM - 7:00 PM",
        requiredSkills: "3D Modeling, Programming",
        description: "Advanced prosthetic hand designs with electronic components"
      },
      {
        name: "Adaptive Gaming Hardware",
        type: "technical",
        maxCapacity: 6,
        currentSize: 0,
        meetingTime: "Tuesdays 7:00 PM - 9:00 PM",
        requiredSkills: "Electronics, Programming, Game Development",
        description: "Create custom gaming controllers for people with disabilities"
      },
      {
        name: "Adaptive Gaming Software",
        type: "technical",
        maxCapacity: 10,
        currentSize: 0,
        meetingTime: "Thursdays 6:00 PM - 8:00 PM",
        requiredSkills: "Programming, Game Development",
        description: "Develop software solutions for accessible gaming"
      },
      {
        name: "Research Team - Accessibility Tech",
        type: "technical",
        maxCapacity: 5,
        currentSize: 0,
        meetingTime: "Fridays 4:00 PM - 6:00 PM",
        requiredSkills: "Research, Programming",
        description: "Research emerging accessibility technologies and innovations"
      },
      {
        name: "Mobile App Development",
        type: "technical",
        maxCapacity: 7,
        currentSize: 0,
        meetingTime: "Saturdays 2:00 PM - 4:00 PM",
        requiredSkills: "Programming, Research",
        description: "Create mobile applications for accessibility and assistive technology"
      }
    ];
    
    const insertedTeams = await db.insert(teams).values(technicalTeamsData).returning();
    console.log(`Created ${insertedTeams.length} technical teams`);
    
    // Create permanent teams with 15 member capacity each
    const constantTeamsData = [
      {
        name: "Marketing Team",
        type: "constant",
        maxCapacity: 15,
        currentSize: 0,
        meetingTime: "Wednesdays 6:00 PM - 7:30 PM",
        location: "Reitz Union Room 2350",
        description: "Social media management, branding, promotional materials, and event marketing"
      },
      {
        name: "Outreach Team", 
        type: "constant",
        maxCapacity: 15,
        currentSize: 0,
        meetingTime: "Fridays 4:00 PM - 5:30 PM",
        location: "Reitz Union Room 2360",
        description: "Community outreach, school visits, educational workshops, and public engagement"
      },
      {
        name: "Art Team",
        type: "constant", 
        maxCapacity: 15,
        currentSize: 0,
        meetingTime: "Tuesdays 7:00 PM - 8:30 PM",
        location: "Fine Arts Building Room C105",
        description: "Graphic design, visual content creation, and artistic elements for prosthetics"
      },
      {
        name: "Events Team",
        type: "constant",
        maxCapacity: 15,
        currentSize: 0,
        meetingTime: "Thursdays 6:30 PM - 8:00 PM",
        location: "Reitz Union Room 2370",
        description: "Social events planning, meeting coordination, and special activities organization"
      },
      {
        name: "3D Printing Team",
        type: "constant",
        maxCapacity: 15,
        currentSize: 0,
        meetingTime: "Mondays 5:00 PM - 6:30 PM",
        location: "MAE-A Building Room 312",
        description: "3D printer operation, maintenance, training, and printing support for all teams"
      }
    ];
    
    const constantTeams = await db.insert(teams).values(constantTeamsData).returning();
    console.log(`Created ${constantTeams.length} constant teams`);
    
    // Create dummy applications with realistic data
    const dummyApplications = [
      {
        fullName: "Alex Johnson",
        firstName: "Alex",
        lastName: "Johnson", 
        email: "alex.johnson@ufl.edu",
        ufid: "12345678",
        teamPreferences: [insertedTeams[0].id, insertedTeams[1].id, insertedTeams[2].id],
        additionalTeams: [constantTeams[0].id, constantTeams[1].id],
        skills: ["3D Modeling", "CAD Design", "Programming"],
        additionalSkills: "Experience with Fusion 360 and SolidWorks. Built several 3D printed projects.",
        timeAvailability: [
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" },
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "pending"
      },
      {
        fullName: "Sarah Chen",
        firstName: "Sarah", 
        lastName: "Chen",
        email: "sarah.chen@ufl.edu",
        ufid: "87654321",
        teamPreferences: [insertedTeams[2].id, insertedTeams[3].id, insertedTeams[4].id],
        additionalTeams: [constantTeams[2].id],
        skills: ["Programming", "Electronics", "Game Development"],
        additionalSkills: "Python, C++, Arduino experience. Created several accessible game mods.",
        timeAvailability: [
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Thursday", startTime: "6:00 PM", endTime: "6:00 PM" },
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "pending"
      },
      {
        fullName: "Marcus Rodriguez",
        firstName: "Marcus",
        lastName: "Rodriguez",
        email: "marcus.rodriguez@ufl.edu", 
        ufid: "11223344",
        teamPreferences: [insertedTeams[4].id, insertedTeams[5].id, insertedTeams[0].id],
        additionalTeams: [constantTeams[0].id],
        skills: ["Research", "Programming"],
        additionalSkills: "Published research on accessibility tech. Java and Python programming.",
        timeAvailability: [
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" },
          { day: "Saturday", startTime: "2:00 PM", endTime: "2:00 PM" },
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTeams[4].id,
        assignmentReason: "Assigned to preference #1: Research Team - Accessibility Tech"
      },
      {
        fullName: "Emily Davis",
        firstName: "Emily",
        lastName: "Davis",
        email: "emily.davis@ufl.edu",
        ufid: "55667788", 
        teamPreferences: [insertedTeams[1].id, insertedTeams[0].id],
        additionalTeams: [constantTeams[1].id, constantTeams[2].id],
        skills: ["3D Modeling", "CAD Design"],
        additionalSkills: "Experienced with Blender and Tinkercad. Designed custom prosthetics before.",
        timeAvailability: [
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" },
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" },
          { day: "Saturday", startTime: "2:00 PM", endTime: "2:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "accepted",
        assignedTeamId: insertedTeams[1].id,
        assignmentReason: "Accepted member assigned to preference #1: 3D-Printed Hands Team Beta"
      },
      {
        fullName: "David Kim",
        firstName: "David",
        lastName: "Kim",
        email: "david.kim@ufl.edu",
        ufid: "99887766",
        teamPreferences: [insertedTeams[3].id, insertedTeams[5].id],
        additionalTeams: [],
        skills: ["Programming", "Game Development"],
        additionalSkills: "Unity and Unreal Engine experience. Created VR accessibility demos.",
        timeAvailability: [
          { day: "Thursday", startTime: "6:00 PM", endTime: "6:00 PM" },
          { day: "Saturday", startTime: "2:00 PM", endTime: "2:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "waitlisted",
        assignmentReason: "All preferred technical teams full - moved to waitlist"
      },
      {
        fullName: "Jessica Thompson",
        firstName: "Jessica",
        lastName: "Thompson",
        email: "jessica.thompson@ufl.edu",
        ufid: "33445566",
        teamPreferences: [insertedTeams[0].id, insertedTeams[2].id, insertedTeams[4].id],
        additionalTeams: [constantTeams[0].id],
        skills: ["3D Modeling", "Electronics", "Research"],
        additionalSkills: "Biomedical engineering background. Experience with medical device design.",
        timeAvailability: [
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" },
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "pending"
      },
      {
        fullName: "Michael Brown",
        firstName: "Michael",
        lastName: "Brown",
        email: "michael.brown@ufl.edu",
        ufid: "77889900",
        teamPreferences: [insertedTeams[5].id, insertedTeams[3].id, insertedTeams[1].id],
        additionalTeams: [constantTeams[2].id],
        skills: ["Programming"],
        additionalSkills: "Mobile app development with React Native. Published apps on App Store.",
        timeAvailability: [
          { day: "Saturday", startTime: "2:00 PM", endTime: "2:00 PM" },
          { day: "Thursday", startTime: "6:00 PM", endTime: "6:00 PM" },
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "accepted",
        assignedTeamId: insertedTeams[5].id,
        assignmentReason: "Accepted member assigned to preference #1: Mobile App Development"
      },
      {
        fullName: "Amanda Wilson",
        firstName: "Amanda",
        lastName: "Wilson",
        email: "amanda.wilson@ufl.edu",
        ufid: "22334455",
        teamPreferences: [insertedTeams[2].id, insertedTeams[4].id],
        additionalTeams: [constantTeams[1].id],
        skills: ["Electronics", "Research"],
        additionalSkills: "Electrical engineering student. Built custom controllers for disabled gamers.",
        timeAvailability: [
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTeams[2].id,
        assignmentReason: "Assigned to preference #1: Adaptive Gaming Hardware"
      }
    ];
    
    const insertedApplications = await db.insert(applications).values(dummyApplications).returning();
    console.log(`Created ${insertedApplications.length} applications`);
    
    // Update team current sizes based on assigned members
    for (const team of insertedTeams) {
      const assignedCount = insertedApplications.filter(app => app.assignedTeamId === team.id).length;
      if (assignedCount > 0) {
        await db.update(teams)
          .set({ currentSize: assignedCount })
          .where(sql`${teams.id} = ${team.id}`);
      }
    }
    
    console.log("Updated team sizes based on assignments");
    console.log("Database seeding completed successfully!");
    
    // Print summary
    console.log("\n=== SUMMARY ===");
    console.log(`Technical Teams: ${insertedTeams.length}`);
    console.log(`Constant Teams: ${constantTeams.length}`);
    console.log(`Applications: ${insertedApplications.length}`);
    console.log("\nApplication Status Breakdown:");
    console.log(`- Pending: ${insertedApplications.filter(a => a.status === 'pending').length}`);
    console.log(`- Assigned: ${insertedApplications.filter(a => a.status === 'assigned').length}`);
    console.log(`- Accepted: ${insertedApplications.filter(a => a.status === 'accepted').length}`);
    console.log(`- Waitlisted: ${insertedApplications.filter(a => a.status === 'waitlisted').length}`);
    
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedDummyData().then(() => {
  console.log("Seeding finished. You can now test admin features.");
  process.exit(0);
});
