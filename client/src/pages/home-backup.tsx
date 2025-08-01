
import { useState } from "react";
import Header from "../components/header";
import MemberForm from "../components/member-form";
import ProjectRequestForm from "../components/project-request-form";
import AdminDashboard from "../components/admin-dashboard";
import TeamCreationForm from "../components/team-creation-form";
import EventCreationForm from "../components/event-creation-form";
import EventAttendanceForm from "../components/event-attendance-form";
import PrintSubmissionForm from "../components/print-submission-form";
import SpecialRoleForm from "../components/special-role-form";
import MarketingRequestForm from "../components/marketing-request-form";
import { useAuth } from "../hooks/use-auth";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
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
  Wrench,
  Send,
  LogIn,
  LogOut,
  User
} from "lucide-react";

type TabType = "home" | "member" | "project" | "admin" | "team" | "create-event" | "event-attendance" | "print-submission" | "special-role" | "marketing-request";

function LandingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Welcome to <span className="text-blue-600">GRiP</span>
        </h1>
        <p className="text-xl text-blue-600 font-semibold mb-2">
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
          <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <svg className="w-16 h-16 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2 text-slate-900">Design & Innovation</h3>
            <p className="text-slate-600">
              Our team works on cutting-edge prosthetic designs using the latest technology 
              and materials to create functional, comfortable solutions.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="w-full h-64 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
            <svg className="w-16 h-16 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2 text-slate-900">Community Collaboration</h3>
            <p className="text-slate-600">
              We work together as a community, sharing knowledge and resources to 
              make prosthetics more accessible to those in need.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="w-full h-64 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
            <svg className="w-16 h-16 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2 text-slate-900">Technical Excellence</h3>
            <p className="text-slate-600">
              Using advanced 3D printing and engineering techniques, we develop 
              high-quality prosthetic devices tailored to individual needs.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-8 text-center border border-blue-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Get Involved
        </h2>
        <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
          Whether you're interested in joining our team, requesting a prosthetic device, 
          or supporting our mission, there are many ways to get involved with GRiP.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <div className="bg-white px-6 py-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <span className="text-sm font-medium text-slate-700">Join Our Team</span>
          </div>
          <div className="bg-white px-6 py-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <span className="text-sm font-medium text-slate-700">Request a Project</span>
          </div>
          <div className="bg-white px-6 py-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <span className="text-sm font-medium text-slate-700">Attend Events</span>
          </div>
          <div className="bg-white px-6 py-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <span className="text-sm font-medium text-slate-700">Apply for Special Roles</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const { isAuthenticated, user, logout, isAdmin } = useAuth();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout();
    } else {
      window.location.href = "/login";
    }
  };

  // Redirect non-admin users away from restricted tabs
  const handleTabChange = (tab: TabType) => {
    // Check if the tab requires admin access
    const adminOnlyTabs: TabType[] = ["admin", "create-event", "team", "print-submission", "marketing-request"];
    
    if (adminOnlyTabs.includes(tab) && (!isAuthenticated || !isAdmin)) {
      // Redirect to home if trying to access admin-only tabs without proper access
      setActiveTab("home");
      return;
    }
    
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {/* Home Tab */}
              <Button
                variant="ghost"
                onClick={() => handleTabChange("home")}
                className={`tab-button px-4 py-3 text-sm font-medium rounded-t-lg ${
                  activeTab === "home" ? "active" : ""
                }`}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>

              {/* Member Services Dropdown - Always visible */}
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
                  <DropdownMenuItem onClick={() => handleTabChange("project")}>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Project Request
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTabChange("member")}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Team
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTabChange("event-attendance")}>
                    <Camera className="w-4 h-4 mr-2" />
                    Event Attendance
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTabChange("special-role")}>
                    <Star className="w-4 h-4 mr-2" />
                    Apply for Role
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Administrative Tools Dropdown - Only for authenticated admin users */}
              {isAuthenticated && isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`tab-button px-4 py-3 text-sm font-medium rounded-t-lg ${
                        ["create-event", "team", "print-submission", "marketing-request"].includes(activeTab) ? "active" : ""
                      }`}
                    >
                      <Wrench className="w-4 h-4 mr-2" />
                      Tools
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleTabChange("create-event")}>
                      <CalendarDays className="w-4 h-4 mr-2" />
                      Create Event
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTabChange("team")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Team
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTabChange("print-submission")}>
                      <Printer className="w-4 h-4 mr-2" />
                      Print Request
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTabChange("marketing-request")}>
                      <Send className="w-4 h-4 mr-2" />
                      Marketing Request
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Admin Tab - Only for authenticated admin users */}
              {isAuthenticated && isAdmin && (
                <Button
                  variant="ghost"
                  onClick={() => handleTabChange("admin")}
                  className={`tab-button px-4 py-3 text-sm font-medium rounded-t-lg ${
                    activeTab === "admin" ? "active" : ""
                  }`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
            </div>

            {/* Authentication Section */}
            <div className="flex items-center space-x-2">
              {isAuthenticated && user && (
                <span className="text-sm text-slate-600">
                  <User className="w-4 h-4 inline mr-1" />
                  {user.firstName || user.email}
                </span>
              )}
              
              {!isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = "/signup"}
                  className="flex items-center"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>
              )}
              
              <Button
                variant={isAuthenticated ? "outline" : "default"}
                size="sm"
                onClick={handleAuthAction}
                className="flex items-center"
              >
                {isAuthenticated ? (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "home" && <LandingPage />}
        {activeTab === "member" && <MemberForm />}
        {activeTab === "project" && <ProjectRequestForm />}
        {activeTab === "special-role" && <SpecialRoleForm />}
        {activeTab === "event-attendance" && <EventAttendanceForm />}
        
        {/* Admin-only content */}
        {isAuthenticated && isAdmin && activeTab === "print-submission" && <PrintSubmissionForm />}
        {isAuthenticated && isAdmin && activeTab === "create-event" && <EventCreationForm />}
        {isAuthenticated && isAdmin && activeTab === "admin" && <AdminDashboard />}
        {isAuthenticated && isAdmin && activeTab === "team" && <TeamCreationForm />}
        {isAuthenticated && isAdmin && activeTab === "marketing-request" && <MarketingRequestForm />}
        
        {/* Show access denied message for admin tabs when not authenticated as admin */}
        {(!isAuthenticated || !isAdmin) && ["print-submission", "create-event", "admin", "team", "marketing-request"].includes(activeTab) && (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
              <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
              <Button onClick={() => handleTabChange("home")} variant="outline">
                Return to Home
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
