
import { db } from "./db.js";
import { teams, applications, additionalTeamSignups } from "../shared/schema.js";
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
    
    // Create 5 technical teams
    const technicalTeamsData = [
      {
        name: "Prosthetic Hands Alpha",
        type: "technical",
        maxCapacity: 8,
        currentSize: 0,
        meetingTime: "Mondays 6:00 PM - 8:00 PM",
        location: "Engineering Building Room 102",
        requiredSkills: "3D Modeling, CAD Design, Biomedical Engineering",
        description: "Design and create advanced prosthetic hands using 3D printing technology for upper limb amputees"
      },
      {
        name: "Adaptive Gaming Controllers",
        type: "technical", 
        maxCapacity: 6,
        currentSize: 0,
        meetingTime: "Tuesdays 7:00 PM - 9:00 PM",
        location: "Computer Science Building Room 301",
        requiredSkills: "Electronics, Programming, Game Development, Hardware Design",
        description: "Create custom gaming controllers and interfaces for people with mobility disabilities"
      },
      {
        name: "Accessibility Research Team",
        type: "technical",
        maxCapacity: 5,
        currentSize: 0,
        meetingTime: "Wednesdays 5:00 PM - 7:00 PM",
        location: "Library Research Room 205",
        requiredSkills: "Research Methodology, Data Analysis, Programming, Technical Writing",
        description: "Research emerging accessibility technologies and publish findings on assistive device effectiveness"
      },
      {
        name: "Mobile Accessibility Apps",
        type: "technical",
        maxCapacity: 7,
        currentSize: 0,
        meetingTime: "Thursdays 6:30 PM - 8:30 PM",
        location: "Innovation Hub Room 150",
        requiredSkills: "Mobile Development, UI/UX Design, Accessibility Standards, Programming",
        description: "Develop mobile applications specifically designed for users with visual, auditory, and motor impairments"
      },
      {
        name: "Smart Home Automation",
        type: "technical",
        maxCapacity: 6,
        currentSize: 0,
        meetingTime: "Fridays 4:00 PM - 6:00 PM",
        location: "Engineering Lab Room 315",
        requiredSkills: "IoT Development, Electronics, Programming, Home Automation",
        description: "Design smart home solutions that can be controlled through voice, gesture, or adaptive interfaces"
      }
    ];
    
    const insertedTechnicalTeams = await db.insert(teams).values(technicalTeamsData).returning();
    console.log(`Created ${insertedTechnicalTeams.length} technical teams`);
    
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
    
    // Create 30 fake members with complete data
    const fakeMembers = [
      {
        fullName: "Alex Rodriguez",
        firstName: "Alex",
        lastName: "Rodriguez",
        email: "alex.rodriguez@ufl.edu",
        ufid: "12345678",
        teamPreferences: [insertedTechnicalTeams[0].id, insertedTechnicalTeams[1].id, insertedTechnicalTeams[2].id],
        additionalTeams: [constantTeams[0].id, constantTeams[4].id],
        skills: ["3D Modeling", "CAD Design", "Programming"],
        additionalSkills: "Extensive experience with Fusion 360, SolidWorks, and Blender. Built several prosthetic prototypes for local hospital.",
        timeAvailability: [
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" },
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTechnicalTeams[0].id,
        assignmentReason: "Assigned to preference #1: Prosthetic Hands Alpha - Strong CAD skills match requirements"
      },
      {
        fullName: "Sarah Chen",
        firstName: "Sarah",
        lastName: "Chen",
        email: "sarah.chen@ufl.edu",
        ufid: "87654321",
        teamPreferences: [insertedTechnicalTeams[1].id, insertedTechnicalTeams[3].id, insertedTechnicalTeams[4].id],
        additionalTeams: [constantTeams[1].id],
        skills: ["Programming", "Electronics", "Game Development"],
        additionalSkills: "Python, C++, Arduino programming. Created accessible game modifications for disabled players. Experience with Unity and hardware interfaces.",
        timeAvailability: [
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" },
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTechnicalTeams[1].id,
        assignmentReason: "Assigned to preference #1: Adaptive Gaming Controllers - Perfect match for gaming and electronics skills"
      },
      {
        fullName: "Marcus Johnson",
        firstName: "Marcus",
        lastName: "Johnson",
        email: "marcus.johnson@ufl.edu",
        ufid: "11223344",
        teamPreferences: [insertedTechnicalTeams[2].id, insertedTechnicalTeams[3].id, insertedTechnicalTeams[0].id],
        additionalTeams: [constantTeams[2].id],
        skills: ["Research", "Programming", "3D Modeling"],
        additionalSkills: "Published research on accessibility technology in IEEE. Proficient in Python, R, and statistical analysis. Experience with user studies.",
        timeAvailability: [
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" },
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" },
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTechnicalTeams[2].id,
        assignmentReason: "Assigned to preference #1: Accessibility Research Team - Strong research background and publications"
      },
      {
        fullName: "Emily Davis",
        firstName: "Emily",
        lastName: "Davis",
        email: "emily.davis@ufl.edu",
        ufid: "55667788",
        teamPreferences: [insertedTechnicalTeams[3].id, insertedTechnicalTeams[1].id, insertedTechnicalTeams[4].id],
        additionalTeams: [constantTeams[0].id, constantTeams[3].id],
        skills: ["Programming", "3D Modeling", "Electronics"],
        additionalSkills: "React Native and Flutter developer. Created 3 accessibility apps currently on app stores. UI/UX design certification.",
        timeAvailability: [
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" },
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTechnicalTeams[3].id,
        assignmentReason: "Assigned to preference #1: Mobile Accessibility Apps - Extensive mobile development experience"
      },
      {
        fullName: "David Kim",
        firstName: "David",
        lastName: "Kim",
        email: "david.kim@ufl.edu",
        ufid: "99887766",
        teamPreferences: [insertedTechnicalTeams[4].id, insertedTechnicalTeams[1].id, insertedTechnicalTeams[2].id],
        additionalTeams: [constantTeams[4].id],
        skills: ["Electronics", "Programming", "CAD Design"],
        additionalSkills: "IoT specialist with Raspberry Pi and Arduino. Smart home automation systems developer. Experience with voice recognition APIs.",
        timeAvailability: [
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" },
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTechnicalTeams[4].id,
        assignmentReason: "Assigned to preference #1: Smart Home Automation - Perfect IoT and automation background"
      },
      {
        fullName: "Jessica Thompson",
        firstName: "Jessica",
        lastName: "Thompson",
        email: "jessica.thompson@ufl.edu",
        ufid: "33445566",
        teamPreferences: [insertedTechnicalTeams[0].id, insertedTechnicalTeams[2].id, insertedTechnicalTeams[3].id],
        additionalTeams: [constantTeams[1].id],
        skills: ["3D Modeling", "Research", "CAD Design"],
        additionalSkills: "Biomedical engineering background. Experience with medical device design and FDA regulations. Internship at prosthetics company.",
        timeAvailability: [
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" },
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" },
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTechnicalTeams[0].id,
        assignmentReason: "Assigned to preference #1: Prosthetic Hands Alpha - Biomedical engineering expertise is crucial"
      },
      {
        fullName: "Michael Brown",
        firstName: "Michael",
        lastName: "Brown",
        email: "michael.brown@ufl.edu",
        ufid: "77889900",
        teamPreferences: [insertedTechnicalTeams[1].id, insertedTechnicalTeams[4].id, insertedTechnicalTeams[3].id],
        additionalTeams: [constantTeams[2].id],
        skills: ["Electronics", "Programming", "Game Development"],
        additionalSkills: "Hardware engineer with focus on adaptive devices. Built custom controllers for disabled gamers. PCB design experience.",
        timeAvailability: [
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" },
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTechnicalTeams[1].id,
        assignmentReason: "Assigned to preference #1: Adaptive Gaming Controllers - Expertise in adaptive hardware design"
      },
      {
        fullName: "Amanda Wilson",
        firstName: "Amanda",
        lastName: "Wilson",
        email: "amanda.wilson@ufl.edu",
        ufid: "22334455",
        teamPreferences: [insertedTechnicalTeams[2].id, insertedTechnicalTeams[3].id, insertedTechnicalTeams[0].id],
        additionalTeams: [constantTeams[0].id],
        skills: ["Research", "Programming", "Electronics"],
        additionalSkills: "PhD student in Human-Computer Interaction. Published papers on accessibility interfaces. Experience with user testing methodologies.",
        timeAvailability: [
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" },
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" },
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTechnicalTeams[2].id,
        assignmentReason: "Assigned to preference #1: Accessibility Research Team - PhD level research experience"
      },
      {
        fullName: "Christopher Lee",
        firstName: "Christopher",
        lastName: "Lee",
        email: "christopher.lee@ufl.edu",
        ufid: "44556677",
        teamPreferences: [insertedTechnicalTeams[3].id, insertedTechnicalTeams[4].id, insertedTechnicalTeams[1].id],
        additionalTeams: [constantTeams[4].id],
        skills: ["Programming", "3D Modeling", "CAD Design"],
        additionalSkills: "Full-stack developer specializing in accessibility features. WCAG 2.1 certified. Experience with React, Node.js, and mobile development.",
        timeAvailability: [
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" },
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" },
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTechnicalTeams[3].id,
        assignmentReason: "Assigned to preference #1: Mobile Accessibility Apps - WCAG certification and accessibility expertise"
      },
      {
        fullName: "Rachel Martinez",
        firstName: "Rachel",
        lastName: "Martinez",
        email: "rachel.martinez@ufl.edu",
        ufid: "66778899",
        teamPreferences: [insertedTechnicalTeams[4].id, insertedTechnicalTeams[0].id, insertedTechnicalTeams[2].id],
        additionalTeams: [constantTeams[1].id, constantTeams[3].id],
        skills: ["Electronics", "Programming", "Research"],
        additionalSkills: "Electrical engineering major with focus on assistive technology. Designed voice-controlled home systems for elderly users.",
        timeAvailability: [
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" },
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" },
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTechnicalTeams[4].id,
        assignmentReason: "Assigned to preference #1: Smart Home Automation - Electrical engineering background perfectly matches"
      },
      {
        fullName: "James Anderson",
        firstName: "James",
        lastName: "Anderson",
        email: "james.anderson@ufl.edu",
        ufid: "88990011",
        teamPreferences: [insertedTechnicalTeams[0].id, insertedTechnicalTeams[1].id, insertedTechnicalTeams[3].id],
        additionalTeams: [constantTeams[2].id],
        skills: ["3D Modeling", "CAD Design", "Electronics"],
        additionalSkills: "Mechanical engineering student with internship at prosthetics lab. Experience with biomechanics and material science.",
        timeAvailability: [
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" },
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTechnicalTeams[0].id,
        assignmentReason: "Assigned to preference #1: Prosthetic Hands Alpha - Mechanical engineering and prosthetics experience"
      },
      {
        fullName: "Sophia Garcia",
        firstName: "Sophia",
        lastName: "Garcia",
        email: "sophia.garcia@ufl.edu",
        ufid: "10203040",
        teamPreferences: [insertedTechnicalTeams[1].id, insertedTechnicalTeams[3].id, insertedTechnicalTeams[4].id],
        additionalTeams: [constantTeams[0].id],
        skills: ["Game Development", "Programming", "Electronics"],
        additionalSkills: "Game design major with accessibility focus. Created award-winning accessible games. Experience with Unity, Unreal Engine, and custom hardware.",
        timeAvailability: [
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" },
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTechnicalTeams[1].id,
        assignmentReason: "Assigned to preference #1: Adaptive Gaming Controllers - Award-winning accessible game design experience"
      },
      {
        fullName: "Daniel White",
        firstName: "Daniel",
        lastName: "White",
        email: "daniel.white@ufl.edu",
        ufid: "50607080",
        teamPreferences: [insertedTechnicalTeams[2].id, insertedTechnicalTeams[0].id, insertedTechnicalTeams[4].id],
        additionalTeams: [constantTeams[4].id],
        skills: ["Research", "3D Modeling", "Programming"],
        additionalSkills: "Computer science PhD with focus on machine learning for accessibility. Published 15+ papers in top-tier conferences.",
        timeAvailability: [
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" },
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" },
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTechnicalTeams[2].id,
        assignmentReason: "Assigned to preference #1: Accessibility Research Team - PhD level research with 15+ publications"
      },
      {
        fullName: "Olivia Taylor",
        firstName: "Olivia",
        lastName: "Taylor",
        email: "olivia.taylor@ufl.edu",
        ufid: "90102030",
        teamPreferences: [insertedTechnicalTeams[3].id, insertedTechnicalTeams[2].id, insertedTechnicalTeams[1].id],
        additionalTeams: [constantTeams[1].id],
        skills: ["Programming", "Research", "Game Development"],
        additionalSkills: "UX researcher specializing in accessible mobile interfaces. Conducted usability studies for major tech companies.",
        timeAvailability: [
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" },
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" },
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTechnicalTeams[3].id,
        assignmentReason: "Assigned to preference #1: Mobile Accessibility Apps - UX research expertise for mobile accessibility"
      },
      {
        fullName: "Ryan Clark",
        firstName: "Ryan",
        lastName: "Clark",
        email: "ryan.clark@ufl.edu",
        ufid: "40506070",
        teamPreferences: [insertedTechnicalTeams[4].id, insertedTechnicalTeams[1].id, insertedTechnicalTeams[0].id],
        additionalTeams: [constantTeams[2].id, constantTeams[4].id],
        skills: ["Electronics", "Programming", "CAD Design"],
        additionalSkills: "IoT engineer with smart home specialization. Built voice-controlled systems for users with mobility impairments.",
        timeAvailability: [
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" },
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "assigned",
        assignedTeamId: insertedTechnicalTeams[4].id,
        assignmentReason: "Assigned to preference #1: Smart Home Automation - IoT specialization with accessibility focus"
      },
      {
        fullName: "Isabella Lewis",
        firstName: "Isabella",
        lastName: "Lewis",
        email: "isabella.lewis@ufl.edu",
        ufid: "30405060",
        teamPreferences: [insertedTechnicalTeams[0].id, insertedTechnicalTeams[2].id, insertedTechnicalTeams[4].id],
        additionalTeams: [constantTeams[0].id],
        skills: ["3D Modeling", "CAD Design", "Research"],
        additionalSkills: "Biomedical engineering with prosthetics research experience. Worked on neural-controlled prosthetic interfaces.",
        timeAvailability: [
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" },
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" },
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "waitlisted",
        assignmentReason: "All preferred technical teams at capacity - added to waitlist"
      },
      {
        fullName: "Noah Walker",
        firstName: "Noah",
        lastName: "Walker",
        email: "noah.walker@ufl.edu",
        ufid: "70809010",
        teamPreferences: [insertedTechnicalTeams[1].id, insertedTechnicalTeams[3].id, insertedTechnicalTeams[2].id],
        additionalTeams: [constantTeams[3].id],
        skills: ["Game Development", "Programming", "Electronics"],
        additionalSkills: "Indie game developer with accessibility features. Created eye-tracking game interfaces for users with limited mobility.",
        timeAvailability: [
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" },
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "waitlisted",
        assignmentReason: "All preferred technical teams at capacity - added to waitlist"
      },
      {
        fullName: "Ava Hall",
        firstName: "Ava",
        lastName: "Hall",
        email: "ava.hall@ufl.edu",
        ufid: "60708090",
        teamPreferences: [insertedTechnicalTeams[2].id, insertedTechnicalTeams[0].id, insertedTechnicalTeams[3].id],
        additionalTeams: [constantTeams[1].id, constantTeams[2].id],
        skills: ["Research", "Programming", "3D Modeling"],
        additionalSkills: "Psychology major with assistive technology research focus. Conducted user studies on prosthetic acceptance and usability.",
        timeAvailability: [
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" },
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" },
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "waitlisted",
        assignmentReason: "All preferred technical teams at capacity - added to waitlist"
      },
      {
        fullName: "Ethan Young",
        firstName: "Ethan",
        lastName: "Young",
        email: "ethan.young@ufl.edu",
        ufid: "80901020",
        teamPreferences: [insertedTechnicalTeams[4].id, insertedTechnicalTeams[3].id, insertedTechnicalTeams[1].id],
        additionalTeams: [constantTeams[4].id],
        skills: ["Electronics", "Programming", "CAD Design"],
        additionalSkills: "Computer engineering with embedded systems focus. Designed smart home solutions for aging-in-place applications.",
        timeAvailability: [
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" },
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" },
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "waitlisted",
        assignmentReason: "All preferred technical teams at capacity - added to waitlist"
      },
      {
        fullName: "Mia Allen",
        firstName: "Mia",
        lastName: "Allen",
        email: "mia.allen@ufl.edu",
        ufid: "15263748",
        teamPreferences: [insertedTechnicalTeams[0].id, insertedTechnicalTeams[1].id, insertedTechnicalTeams[2].id],
        additionalTeams: [constantTeams[0].id, constantTeams[2].id],
        skills: ["3D Modeling", "CAD Design", "Programming"],
        additionalSkills: "Industrial design major with focus on medical devices. Experience with user-centered design and rapid prototyping.",
        timeAvailability: [
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" },
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "pending"
      },
      {
        fullName: "Liam Scott",
        firstName: "Liam",
        lastName: "Scott",
        email: "liam.scott@ufl.edu",
        ufid: "25374859",
        teamPreferences: [insertedTechnicalTeams[1].id, insertedTechnicalTeams[4].id, insertedTechnicalTeams[3].id],
        additionalTeams: [constantTeams[3].id],
        skills: ["Game Development", "Electronics", "Programming"],
        additionalSkills: "Software engineering with gaming focus. Developed adaptive gaming peripherals and custom input devices for accessibility.",
        timeAvailability: [
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" },
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "pending"
      },
      {
        fullName: "Charlotte Green",
        firstName: "Charlotte",
        lastName: "Green",
        email: "charlotte.green@ufl.edu",
        ufid: "35485960",
        teamPreferences: [insertedTechnicalTeams[2].id, insertedTechnicalTeams[3].id, insertedTechnicalTeams[0].id],
        additionalTeams: [constantTeams[1].id],
        skills: ["Research", "Programming", "3D Modeling"],
        additionalSkills: "Data science major with accessibility research experience. Analyzed user interaction patterns with assistive technologies.",
        timeAvailability: [
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" },
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" },
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "pending"
      },
      {
        fullName: "Lucas Adams",
        firstName: "Lucas",
        lastName: "Adams",
        email: "lucas.adams@ufl.edu",
        ufid: "45596071",
        teamPreferences: [insertedTechnicalTeams[3].id, insertedTechnicalTeams[4].id, insertedTechnicalTeams[1].id],
        additionalTeams: [constantTeams[2].id, constantTeams[4].id],
        skills: ["Programming", "Electronics", "CAD Design"],
        additionalSkills: "Mobile app developer with accessibility certification. Created voice-activated applications for visually impaired users.",
        timeAvailability: [
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" },
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" },
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "pending"
      },
      {
        fullName: "Harper Baker",
        firstName: "Harper",
        lastName: "Baker",
        email: "harper.baker@ufl.edu",
        ufid: "55607182",
        teamPreferences: [insertedTechnicalTeams[4].id, insertedTechnicalTeams[0].id, insertedTechnicalTeams[2].id],
        additionalTeams: [constantTeams[0].id],
        skills: ["Electronics", "Programming", "Research"],
        additionalSkills: "Electrical engineering with home automation research. Designed gesture-controlled interfaces for users with speech impairments.",
        timeAvailability: [
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" },
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" },
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "pending"
      },
      {
        fullName: "Benjamin Nelson",
        firstName: "Benjamin",
        lastName: "Nelson",
        email: "benjamin.nelson@ufl.edu",
        ufid: "65718293",
        teamPreferences: [insertedTechnicalTeams[0].id, insertedTechnicalTeams[3].id, insertedTechnicalTeams[4].id],
        additionalTeams: [constantTeams[3].id, constantTeams[1].id],
        skills: ["3D Modeling", "CAD Design", "Programming"],
        additionalSkills: "Mechanical engineering with prosthetics internship. Designed lightweight prosthetic components using advanced materials.",
        timeAvailability: [
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" },
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" },
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "pending"
      },
      {
        fullName: "Ella Carter",
        firstName: "Ella",
        lastName: "Carter",
        email: "ella.carter@ufl.edu",
        ufid: "75829304",
        teamPreferences: [insertedTechnicalTeams[1].id, insertedTechnicalTeams[2].id, insertedTechnicalTeams[0].id],
        additionalTeams: [constantTeams[2].id],
        skills: ["Game Development", "Programming", "Research"],
        additionalSkills: "Computer science with game development focus. Created adaptive gaming solutions for users with various disabilities.",
        timeAvailability: [
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" },
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "pending"
      },
      {
        fullName: "Alexander Mitchell",
        firstName: "Alexander",
        lastName: "Mitchell",
        email: "alexander.mitchell@ufl.edu",
        ufid: "85940415",
        teamPreferences: [insertedTechnicalTeams[2].id, insertedTechnicalTeams[4].id, insertedTechnicalTeams[3].id],
        additionalTeams: [constantTeams[4].id],
        skills: ["Research", "Electronics", "Programming"],
        additionalSkills: "PhD in human factors engineering. Research focus on cognitive interfaces for assistive technology users.",
        timeAvailability: [
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" },
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" },
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "pending"
      },
      {
        fullName: "Madison Perez",
        firstName: "Madison",
        lastName: "Perez",
        email: "madison.perez@ufl.edu",
        ufid: "96051526",
        teamPreferences: [insertedTechnicalTeams[3].id, insertedTechnicalTeams[1].id, insertedTechnicalTeams[4].id],
        additionalTeams: [constantTeams[0].id, constantTeams[1].id],
        skills: ["Programming", "Game Development", "Electronics"],
        additionalSkills: "UX/UI designer with accessibility expertise. Designed mobile interfaces following WCAG guidelines for major accessibility apps.",
        timeAvailability: [
          { day: "Thursday", startTime: "6:30 PM", endTime: "6:30 PM" },
          { day: "Tuesday", startTime: "7:00 PM", endTime: "7:00 PM" },
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "pending"
      },
      {
        fullName: "Jack Roberts",
        firstName: "Jack",
        lastName: "Roberts",
        email: "jack.roberts@ufl.edu",
        ufid: "16273849",
        teamPreferences: [insertedTechnicalTeams[4].id, insertedTechnicalTeams[2].id, insertedTechnicalTeams[0].id],
        additionalTeams: [constantTeams[3].id],
        skills: ["Electronics", "Programming", "CAD Design"],
        additionalSkills: "Embedded systems engineer with smart home focus. Developed voice-controlled environmental systems for users with mobility limitations.",
        timeAvailability: [
          { day: "Friday", startTime: "4:00 PM", endTime: "4:00 PM" },
          { day: "Wednesday", startTime: "5:00 PM", endTime: "5:00 PM" },
          { day: "Monday", startTime: "6:00 PM", endTime: "6:00 PM" }
        ],
        acknowledgments: [true, true, true, true, true, true, true],
        status: "pending"
      }
    ];
    
    const insertedApplications = await db.insert(applications).values(fakeMembers).returning();
    console.log(`Created ${insertedApplications.length} fake member applications`);
    
    // Update team current sizes based on assigned members
    for (const team of insertedTechnicalTeams) {
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
    console.log(`Technical Teams: ${insertedTechnicalTeams.length}`);
    console.log(`Constant Teams: ${constantTeams.length}`);
    console.log(`Applications: ${insertedApplications.length}`);
    console.log("\nApplication Status Breakdown:");
    console.log(`- Pending: ${insertedApplications.filter(a => a.status === 'pending').length}`);
    console.log(`- Assigned: ${insertedApplications.filter(a => a.status === 'assigned').length}`);
    console.log(`- Accepted: ${insertedApplications.filter(a => a.status === 'accepted').length}`);
    console.log(`- Waitlisted: ${insertedApplications.filter(a => a.status === 'waitlisted').length}`);
    
    // Print team assignments
    console.log("\nTeam Assignment Summary:");
    for (const team of insertedTechnicalTeams) {
      const assignedCount = insertedApplications.filter(app => app.assignedTeamId === team.id).length;
      console.log(`- ${team.name}: ${assignedCount}/${team.maxCapacity} members`);
    }
    
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedDummyData().then(() => {
  console.log("Seeding finished. You can now test admin features with 5 technical teams and 30 fake members.");
  process.exit(0);
});
