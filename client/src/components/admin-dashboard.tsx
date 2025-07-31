import { useState } from "react";
import { Button } from "./ui/button";
import { 
  BarChart3, Users, Inbox, Settings, Wand2, Camera, 
  Printer, Star, Send, Menu, X, Key, UserCheck
} from "lucide-react";
import AdminCodeManager from "./admin-code-manager";
import OverviewSection from "./admin/OverviewSection";
import ApplicationsSection from "./admin/ApplicationsSection";
import TeamsSection from "./admin/TeamsSection";
import MembersSection from "./admin/MembersSection";
import ProjectsSection from "./admin/ProjectsSection";
import PrintManagementSection from "./admin/PrintManagementSection";
import SettingsSection from "./admin/SettingsSection";

type ActiveSection = "overview" | "applications" | "teams" | "members" | "projects" | 
  "settings" | "event-attendance" | "print-management" | "special-roles" | 
  "marketing-requests" | "admin-codes";

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "applications" as const, label: "Applications", icon: Inbox },
    { id: "teams" as const, label: "Teams", icon: Users },
    { id: "members" as const, label: "Members", icon: UserCheck },
    { id: "projects" as const, label: "Projects", icon: Wand2 },
    { id: "print-management" as const, label: "Print Management", icon: Printer },
    { id: "admin-codes" as const, label: "Admin Codes", icon: Key },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection />;
      case "applications":
        return <ApplicationsSection />;
      case "teams":
        return <TeamsSection />;
      case "members":
        return <MembersSection />;
      case "projects":
        return <ProjectsSection />;
      case "print-management":
        return <PrintManagementSection />;
      case "admin-codes":
        return <AdminCodeManager />;
      case "settings":
        return <SettingsSection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">GRiP Admin Dashboard</h1>
        
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Navigation</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? "default" : "ghost"}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "ghost"}
                  onClick={() => setActiveSection(item.id)}
                  className="w-full justify-start"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="space-y-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
