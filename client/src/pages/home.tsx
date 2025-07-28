import { useState } from "react";
import Header from "@/components/header";
import MemberForm from "@/components/member-form";
import ProjectRequestForm from "@/components/project-request-form";
import AdminDashboard from "@/components/admin-dashboard";
import TeamCreationForm from "@/components/team-creation-form";
import EventCreationForm from "@/components/event-creation-form";
import EventAttendanceForm from "@/components/event-attendance-form";
import PrintSubmissionForm from "@/components/print-submission-form";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, Lightbulb, Settings, Plus, CalendarDays, Camera, Printer } from "lucide-react";
import { Link } from "wouter";

type TabType = "member" | "project" | "admin" | "team" | "create-event" | "event-attendance" | "print-submission";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("member");

  const tabs = [
    { id: "member" as TabType, label: "Join Team", icon: UserPlus },
    { id: "project" as TabType, label: "Project Request", icon: Lightbulb },
    { id: "print-submission" as TabType, label: "Print Request", icon: Printer },
    { id: "create-event" as TabType, label: "Create Event", icon: CalendarDays },
    { id: "event-attendance" as TabType, label: "Event Attendance", icon: Camera },
    { id: "admin" as TabType, label: "Admin", icon: Settings },
    { id: "team" as TabType, label: "Create Team", icon: Plus },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="ghost"
                onClick={() => setActiveTab(id)}
                className={`tab-button px-4 py-3 text-sm font-medium rounded-t-lg whitespace-nowrap ${
                  activeTab === id ? "active" : ""
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "member" && <MemberForm />}
        {activeTab === "project" && <ProjectRequestForm />}
        {activeTab === "print-submission" && <PrintSubmissionForm />}
        {activeTab === "create-event" && <EventCreationForm />}
        {activeTab === "event-attendance" && <EventAttendanceForm />}
        {activeTab === "admin" && <AdminDashboard />}
        {activeTab === "team" && <TeamCreationForm />}
      </main>
    </div>
  );
}