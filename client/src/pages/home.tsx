import { useState } from "react";
import Header from "@/components/header";
import MemberForm from "@/components/member-form";
import AdditionalTeamsForm from "@/components/additional-teams-form";
import ProjectRequestForm from "@/components/project-request-form";
import AdminDashboard from "@/components/admin-dashboard";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, Lightbulb, Settings } from "lucide-react";

type TabType = "member" | "additional" | "project" | "admin";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("member");

  const tabs = [
    { id: "member" as TabType, label: "Join Team", icon: UserPlus },
    { id: "additional" as TabType, label: "Additional Teams", icon: Users },
    { id: "project" as TabType, label: "Project Request", icon: Lightbulb },
    { id: "admin" as TabType, label: "Admin", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
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
        {activeTab === "additional" && <AdditionalTeamsForm />}
        {activeTab === "project" && <ProjectRequestForm />}
        {activeTab === "admin" && <AdminDashboard />}
      </main>
    </div>
  );
}
