
import { useState } from "react";
import Header from "@/components/header";
import MemberForm from "@/components/member-form";
import ProjectRequestForm from "@/components/project-request-form";
import AdminDashboard from "@/components/admin-dashboard";
import TeamCreationForm from "@/components/team-creation-form";
import EventCreationForm from "@/components/event-creation-form";
import EventAttendanceForm from "@/components/event-attendance-form";
import PrintSubmissionForm from "@/components/print-submission-form";
import SpecialRoleForm from "@/components/special-role-form";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  UserPlus, 
  Users, 
  Lightbulb, 
  Settings, 
  Plus, 
  CalendarDays, 
  Camera, 
  Printer, 
  Star,
  ChevronDown,
  Home,
  UserCheck,
  Wrench
} from "lucide-react";

type TabType = "home" | "member" | "project" | "admin" | "team" | "create-event" | "event-attendance" | "print-submission" | "special-role";

function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Welcome to GRiP
        </h1>
        <p className="text-xl text-slate-600 mb-2">
          Generational Relief in Prosthetics
        </p>
        <p className="text-lg text-slate-500 max-w-3xl mx-auto">
          GRiP is dedicated to creating innovative prosthetic solutions through collaborative design, 
          3D printing technology, and community engagement. Our mission is to provide accessible, 
          customizable prosthetic devices that improve quality of life.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <img 
            src="/attached_assets/image_1753634520859.png" 
            alt="GRiP team member working on prosthetic design" 
            className="w-full h-64 object-cover"
          />
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2">Design & Innovation</h3>
            <p className="text-slate-600">
              Our team works on cutting-edge prosthetic designs using the latest technology 
              and materials to create functional, comfortable solutions.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <img 
            src="/attached_assets/image_1753728143544.png" 
            alt="GRiP community collaboration" 
            className="w-full h-64 object-cover"
          />
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2">Community Collaboration</h3>
            <p className="text-slate-600">
              We work together as a community, sharing knowledge and resources to 
              make prosthetics more accessible to those in need.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <img 
            src="/attached_assets/image_1753728186401.png" 
            alt="GRiP technical development" 
            className="w-full h-64 object-cover"
          />
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2">Technical Excellence</h3>
            <p className="text-slate-600">
              Using advanced 3D printing and engineering techniques, we develop 
              high-quality prosthetic devices tailored to individual needs.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-100 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Get Involved
        </h2>
        <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
          Whether you're interested in joining our team, requesting a prosthetic device, 
          or supporting our mission, there are many ways to get involved with GRiP.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
            <span className="text-sm font-medium text-slate-700">Join Our Team</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
            <span className="text-sm font-medium text-slate-700">Request a Project</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
            <span className="text-sm font-medium text-slate-700">Attend Events</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
            <span className="text-sm font-medium text-slate-700">Apply for Special Roles</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("home");

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1">
            {/* Home Tab */}
            <Button
              variant="ghost"
              onClick={() => setActiveTab("home")}
              className={`tab-button px-4 py-3 text-sm font-medium rounded-t-lg ${
                activeTab === "home" ? "active" : ""
              }`}
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>

            {/* Member Services Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`tab-button px-4 py-3 text-sm font-medium rounded-t-lg ${
                    ["project", "member", "event-attendance", "special-role"].includes(activeTab) ? "active" : ""
                  }`}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Member Services
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setActiveTab("project")}>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Project Request
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("member")}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Team
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("event-attendance")}>
                  <Camera className="w-4 h-4 mr-2" />
                  Event Attendance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("special-role")}>
                  <Star className="w-4 h-4 mr-2" />
                  Apply for Role
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Administrative Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`tab-button px-4 py-3 text-sm font-medium rounded-t-lg ${
                    ["create-event", "team", "print-submission"].includes(activeTab) ? "active" : ""
                  }`}
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Tools
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setActiveTab("create-event")}>
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Create Event
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("team")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("print-submission")}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Request
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin Tab */}
            <Button
              variant="ghost"
              onClick={() => setActiveTab("admin")}
              className={`tab-button px-4 py-3 text-sm font-medium rounded-t-lg ${
                activeTab === "admin" ? "active" : ""
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "home" && <HomePage />}
        {activeTab === "member" && <MemberForm />}
        {activeTab === "project" && <ProjectRequestForm />}
        {activeTab === "special-role" && <SpecialRoleForm />}
        {activeTab === "print-submission" && <PrintSubmissionForm />}
        {activeTab === "create-event" && <EventCreationForm />}
        {activeTab === "event-attendance" && <EventAttendanceForm />}
        {activeTab === "admin" && <AdminDashboard />}
        {activeTab === "team" && <TeamCreationForm />}
      </main>
    </div>
  );
}
