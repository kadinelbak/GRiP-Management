import { useState } from "react";
import Header from "../components/header";
import MemberForm from "../components/member-form";
import ProjectRequestForm from "../components/project-request-form";
import EventAttendanceForm from "../components/event-attendance-form";
import SpecialRoleForm from "../components/special-role-form";
import MarketingRequestForm from "../components/marketing-request-form";
import { useAuth } from "../hooks/use-auth";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { 
  UserPlus, 
  Lightbulb, 
  Plus, 
  CalendarDays, 
  Star,
  ChevronDown,
  Send
} from "lucide-react";

type ServiceType = "member-application" | "project-request" | "event-attendance" | "special-role" | "marketing-request";

export default function MemberServicesPage() {
  const [activeService, setActiveService] = useState<ServiceType | null>(null);
  const { user } = useAuth();

  const services = [
    {
      id: "member-application" as const,
      title: "Member Application",
      description: "Apply to join our organization and become part of our mission",
      icon: UserPlus,
      color: "from-blue-100 to-blue-200",
      iconColor: "text-blue-600"
    },
    {
      id: "project-request" as const,
      title: "Project Request",
      description: "Submit a request for a prosthetic project or design",
      icon: Lightbulb,
      color: "from-purple-100 to-purple-200",
      iconColor: "text-purple-600"
    },
    {
      id: "event-attendance" as const,
      title: "Event Attendance",
      description: "Submit attendance for GRiP events and earn points",
      icon: CalendarDays,
      color: "from-green-100 to-green-200",
      iconColor: "text-green-600"
    },
    {
      id: "special-role" as const,
      title: "Special Role Application",
      description: "Apply for leadership positions and special roles",
      icon: Star,
      color: "from-yellow-100 to-yellow-200",
      iconColor: "text-yellow-600"
    },
    {
      id: "marketing-request" as const,
      title: "Marketing Request",
      description: "Request marketing materials or promotional support",
      icon: Send,
      color: "from-pink-100 to-pink-200",
      iconColor: "text-pink-600"
    }
  ];

  const renderActiveService = () => {
    switch (activeService) {
      case "member-application":
        return <MemberForm />;
      case "project-request":
        return <ProjectRequestForm />;
      case "event-attendance":
        return <EventAttendanceForm />;
      case "special-role":
        return <SpecialRoleForm />;
      case "marketing-request":
        return <MarketingRequestForm />;
      default:
        return null;
    }
  };

  return (
    <div>
      <Header />
      <div className="container mx-auto p-6">
        {activeService ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => setActiveService(null)}
              >
                ← Back to Services
              </Button>
              <h1 className="text-2xl font-bold text-slate-900">
                {services.find(s => s.id === activeService)?.title}
              </h1>
            </div>
            {renderActiveService()}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-slate-900">Member Services</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Access various services and applications available to GRiP members. 
                Select a service below to get started.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <Card 
                    key={service.id}
                    className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                    onClick={() => setActiveService(service.id)}
                  >
                    <CardHeader className="text-center">
                      <div className={`w-full h-32 bg-gradient-to-br ${service.color} flex items-center justify-center rounded-lg mb-4`}>
                        <Icon className={`w-12 h-12 ${service.iconColor}`} />
                      </div>
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {service.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 text-sm text-center">
                        {service.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {user && (
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Welcome, {user.firstName}!
                </h3>
                <p className="text-blue-700">
                  Your current role: <span className="font-medium capitalize">{user.role}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
