import { useState } from "react";
import TeamCreationForm from "../components/team-creation-form";
import EventCreationForm from "../components/event-creation-form";
import PrintSubmissionForm from "../components/print-submission-form";
import MarketingRequestForm from "../components/marketing-request-form";
import NewsStoryForm from "../components/news-story-form";
import { useAuth } from "../hooks/use-auth";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { 
  Users, 
  CalendarDays, 
  Printer, 
  Settings,
  Wand2,
  Plus,
  Send,
  Newspaper
} from "lucide-react";

type ToolType = "team-creation" | "event-creation" | "print-submission" | "marketing-request" | "news-story";

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const { user } = useAuth();

  const tools = [
    {
      id: "team-creation" as const,
      title: "Team Creation",
      description: "Create and manage teams within the organization",
      icon: Users,
      color: "from-blue-100 to-blue-200",
      iconColor: "text-blue-600",
      roles: ["admin", "president", "project_manager"]
    },
    {
      id: "event-creation" as const,
      title: "Event Creation",
      description: "Create new events and manage event details",
      icon: CalendarDays,
      color: "from-green-100 to-green-200",
      iconColor: "text-green-600",
      roles: ["admin", "president", "project_manager", "outreach_coordinator"]
    },
    {
      id: "print-submission" as const,
      title: "Print Submission",
      description: "Submit requests for 3D printing services",
      icon: Printer,
      color: "from-purple-100 to-purple-200",
      iconColor: "text-purple-600",
      roles: ["admin", "president", "project_manager", "printer_manager", "captain"]
    },
    {
      id: "marketing-request" as const,
      title: "Marketing Request",
      description: "Request marketing materials and promotional content",
      icon: Send,
      color: "from-orange-100 to-orange-200",
      iconColor: "text-orange-600",
      roles: ["admin", "president", "project_manager", "outreach_coordinator", "coordinator"]
    },
    {
      id: "news-story" as const,
      title: "Create News Story",
      description: "Write and submit new news stories for publication",
      icon: Newspaper,
      color: "from-indigo-100 to-indigo-200",
      iconColor: "text-indigo-600",
      roles: ["admin", "president", "project_manager", "outreach_coordinator", "coordinator", "manager"]
    }
  ];

  // Filter tools based on user role
  const availableTools = tools.filter(tool => 
    user?.role && tool.roles.includes(user.role)
  );

  const renderActiveTool = () => {
    switch (activeTool) {
      case "team-creation":
        return <TeamCreationForm />;
      case "event-creation":
        return <EventCreationForm />;
      case "print-submission":
        return <PrintSubmissionForm />;
      case "marketing-request":
        return <MarketingRequestForm />;
      case "news-story":
        return <NewsStoryForm />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="container mx-auto p-6">
        {activeTool ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => setActiveTool(null)}
              >
                ← Back to Tools
              </Button>
              <h1 className="text-2xl font-bold text-slate-900">
                {tools.find(t => t.id === activeTool)?.title}
              </h1>
            </div>
            {renderActiveTool()}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-slate-900">Tools & Utilities</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Access administrative tools and utilities based on your role and permissions.
              </p>
            </div>

            {availableTools.length === 0 ? (
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-600 mb-2">No Tools Available</h2>
                <p className="text-gray-500">
                  You don't have access to any tools with your current role. 
                  Contact an administrator if you believe this is an error.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {availableTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Card 
                      key={tool.id}
                      className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                      onClick={() => setActiveTool(tool.id)}
                    >
                      <CardHeader className="text-center">
                        <div className={`w-full h-32 bg-gradient-to-br ${tool.color} flex items-center justify-center rounded-lg mb-4`}>
                          <Icon className={`w-12 h-12 ${tool.iconColor}`} />
                        </div>
                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                          {tool.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600 text-sm text-center mb-3">
                          {tool.description}
                        </p>
                        <div className="text-xs text-gray-500 text-center">
                          Available to: {tool.roles.map(role => role.replace('_', ' ')).join(', ')}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {user && (
              <div className="mt-8 p-4 bg-purple-50 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">
                  Your Access Level
                </h3>
                <p className="text-purple-700">
                  Role: <span className="font-medium capitalize">{user.role.replace('_', ' ')}</span>
                </p>
                <p className="text-purple-600 text-sm mt-1">
                  You have access to {availableTools.length} tool{availableTools.length !== 1 ? 's' : ''}.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
