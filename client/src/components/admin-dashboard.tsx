import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeamSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, Users, Inbox, Settings, Plus, Download, 
  Wand2, Eye, Edit, Trash2, CheckCircle, Clock, UserMinus, Calendar, 
  CalendarX, Search, Filter, UserCheck, Save, X
} from "lucide-react";
import type { Team, Application, ProjectRequest } from "@shared/schema";
import type { z } from "zod";

type TeamFormData = z.infer<typeof insertTeamSchema>;

interface AdminStats {
  totalApplications: number;
  assignedApplications: number;
  waitlistedApplications: number;
  totalTeams: number;
  filledTeams: number;
  totalProjectRequests: number;
  totalAdditionalSignups: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const form = useForm<TeamFormData>({
    resolver: zodResolver(insertTeamSchema),
    defaultValues: {
      name: "",
      type: "technical",
      maxCapacity: 15,
      meetingTime: "",
      requiredSkills: "",
      description: "",
    },
  });

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: acceptedMembers = [] } = useQuery<Application[]>({
    queryKey: ["/api/accepted-members"],
  });

  const { data: absences = [] } = useQuery<any[]>({
    queryKey: ["/api/absences"],
  });

  const { data: projectRequests = [] } = useQuery<ProjectRequest[]>({
    queryKey: ["/api/project-requests"],
  });

  const { data: additionalSignups = [] } = useQuery<any[]>({
    queryKey: ["/api/additional-signups"],
  });

  // Mutation for creating teams
  const createTeamMutation = useMutation({
    mutationFn: (data: TeamFormData) =>
      apiRequest("POST", "/api/teams", data),
    onSuccess: () => {
      toast({
        title: "Team Created",
        description: "New team has been created successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create team.",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting applications
  const deleteApplicationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/applications/${id}`),
    onSuccess: () => {
      toast({
        title: "Application Deleted",
        description: "Application has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete application.",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating application status
  const updateApplicationMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Application> }) =>
      apiRequest("PUT", `/api/applications/${id}`, updates),
    onSuccess: () => {
      toast({
        title: "Application Updated",
        description: "Application status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-members"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application.",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting members
  const deleteMemberMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/applications/${id}`),
    onSuccess: () => {
      toast({
        title: "Member Removed",
        description: "Member has been removed from the system.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      setSelectedMember(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove member.",
        variant: "destructive",
      });
    },
  });

  // Mutation for removing all members
  const removeAllMembersMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/admin/remove-all-members"),
    onSuccess: () => {
      toast({
        title: "All Members Removed",
        description: "All members have been removed from their teams.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedMember(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove all members.",
        variant: "destructive",
      });
    },
  });

  const autoAssignMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/assign-teams"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });

      // Auto-download the assignment log file
      if (data.logFileContent && data.logFileName) {
        const blob = new Blob([data.logFileContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.logFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: "Auto Assignment Complete",
        description: `Successfully processed ${data.assignments?.length || 0} applications. Assignment log has been downloaded.`,
      });
    },
    onError: (error: any) => {
      console.error("Auto assignment error:", error);
      toast({
        title: "Assignment Failed",
        description: "Failed to automatically assign teams. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove duplicate - using autoAssignMutation above

  // Mutation for updating project request status
  const updateProjectRequestMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      apiRequest("PUT", `/api/project-requests/${id}`, updates),
    onSuccess: () => {
      toast({
        title: "Project Request Updated",
        description: "Project request status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/project-requests"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update project request.",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting project requests
  const deleteProjectRequestMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/project-requests/${id}`),
    onSuccess: () => {
      toast({
        title: "Project Request Deleted",
        description: "Project request has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/project-requests"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete project request.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TeamFormData) => {
    createTeamMutation.mutate(data);
  };

  const handleDeleteApplication = (id: string) => {
    deleteApplicationMutation.mutate(id);
  };

  const handleDeleteMember = (id: string) => {
    deleteMemberMutation.mutate(id);
  };

  const handleUpdateApplicationStatus = (id: string, status: string) => {
    updateApplicationMutation.mutate({ id, updates: { status } });
  };

  const handleUpdateProjectRequest = (id: string, updates: any) => {
    updateProjectRequestMutation.mutate({ id, updates });
  };

  const handleExportMembers = () => {
    window.open("/api/export/members", "_blank");
  };

  const handleExportApplications = () => {
    window.open("/api/export/applications", "_blank");
  };

  const convertToTeamMutation = useMutation({
    mutationFn: async ({ projectId, teamData }: { projectId: string; teamData: any }) => {
      const response = await apiRequest("POST", "/api/admin/convert-project-to-team", { projectId, teamData });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-requests"] });
      toast({
        title: "Success",
        description: "Project converted to team successfully",
      });
    },
    onError: (error: any) => {
      console.error("Convert to team error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to convert project to team",
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      apiRequest("PUT", `/api/project-requests/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-requests"] });
      toast({
        title: "Success",
        description: "Project request updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update project request",
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/project-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-requests"] });
      toast({
        title: "Success",
        description: "Project request deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete project request",
        variant: "destructive",
      });
    },
  });

  const handleConvertToTeam = (project: ProjectRequest) => {
    const teamData = {
      name: project.projectTitle,
      type: "technical" as const,
      description: project.description,
      maxCapacity: 8, // Default capacity
      meetingTime: "TBD - Contact team lead for meeting times",
      requiredSkills: project.description || "", // Use description as skills info
    };

    convertToTeamMutation.mutate({ projectId: project.id, teamData });
  };

  const handleUpdateProjectStatus = (id: string, status: string) => {
    updateProjectMutation.mutate({ id, updates: { status } });
  };

  const handleDeleteProject = (id: string) => {
    if (confirm("Are you sure you want to delete this project request?")) {
      deleteProjectMutation.mutate(id);
    }
  };

  // Filter applications based on search and status, excluding assigned members
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.ufid.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const isNotAssigned = app.status !== "assigned"; // Exclude assigned members from submissions
    return matchesSearch && matchesStatus && isNotAssigned;
  });

  // Filter members based on search
  const filteredMembers = acceptedMembers.filter(member =>
    member.fullName.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    member.ufid.includes(memberSearchTerm)
  );

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return "Unassigned";
    const team = teams.find(t => t.id === teamId);
    return team?.name || "Unknown Team";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">GRiP Admin Dashboard</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Users className="w-4 h-4 mr-2" />
            Technical Teams
          </TabsTrigger>
          <TabsTrigger value="members">
            <UserCheck className="w-4 h-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <Inbox className="w-4 h-4 mr-2" />
            Submissions
          </TabsTrigger>
          <TabsTrigger value="projects">
            <Wand2 className="w-4 h-4 mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <Inbox className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalApplications || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.assignedApplications || 0} assigned, {stats?.waitlistedApplications || 0} waitlisted
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Teams</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalTeams || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.filledTeams || 0} at capacity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Project Requests</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalProjectRequests || 0}</div>
                <p className="text-xs text-muted-foreground">
                  External project submissions
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Team Management</CardTitle>
              <p className="text-sm text-slate-600">
                Use the "Create Team" tab to add new teams
              </p>
            </CardHeader>
            <CardContent>
              <div>
                <h3 className="text-lg font-semibold mb-4">Existing Teams</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {teams.filter(team => team.type === "constant").map((team) => (
                    <Card key={team.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{team.name}</h4>
                          <p className="text-sm text-gray-600">{team.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Capacity: {team.currentSize}/{team.maxCapacity} | {team.meetingTime}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {team.type}
                        </Badge>
                      </div>
                    </Card>
                  ))}</div>
              </div>
            </CardContent>
          </Card>

          {/* Team Assignments - Accepted and Assigned Members */}
          <Card>
            <CardHeader>
              <CardTitle>Team Assignments (Active Members)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {teams.map((team) => {
                  const teamMembers = acceptedMembers.filter(member => member.assignedTeamId === team.id);
                  return (
                    <Card key={team.id} className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">{team.name}</h4>
                        <Badge variant="outline">
                          {teamMembers.length}/{team.maxCapacity} members
                        </Badge>
                      </div>

                      {teamMembers.length > 0 ? (
                        <div className="space-y-2">
                          {teamMembers.map((member) => {
                            const memberAbsences = absences.filter(absence => 
                              absence.applicationId === member.id && absence.isActive
                            );
                            const absenceCount = memberAbsences.length;

                            const getAbsenceColor = (count: number) => {
                              if (count === 0) return "text-green-600";
                              if (count === 1) return "text-yellow-600";
                              if (count === 2) return "text-orange-600";
                              return "text-red-600";
                            };

                            return (
                              <div key={member.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded hover:bg-gray-100">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{member.fullName}</span>
                                    {absenceCount > 0 && (
                                      <Badge variant="outline" className={`text-xs ${getAbsenceColor(absenceCount)} border-current`}>
                                        {absenceCount} absence{absenceCount !== 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {member.email} | UFID: {member.ufid}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      const reason = prompt("Reason for absence (optional):");
                                      const date = new Date().toISOString().split('T')[0];

                                      try {
                                        await fetch('/api/absences', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            applicationId: member.id,
                                            reason: reason || '',
                                            startDate: date
                                          })
                                        });
                                        toast({ title: "Absence added successfully" });
                                        queryClient.invalidateQueries({ queryKey: ['/api/absences'] });
                                        queryClient.invalidateQueries({ queryKey: ['/api/accepted-members'] });
                                      } catch (error) {
                                        toast({ title: "Failed to add absence", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    <CalendarX className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to remove ${member.fullName} from the system?`)) {
                                        handleDeleteMember(member.id);
                                      }
                                    }}
                                    disabled={deleteMemberMutation.isPending}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No active members assigned</p>
                      )}
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Current Members (Accepted & Assigned)</CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleExportMembers} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  onClick={() => {
                    if (confirm("Are you sure you want to remove ALL members from all teams? This action cannot be undone.")) {
                      removeAllMembersMutation.mutate();
                    }
                  }}
                  variant="destructive" 
                  size="sm"
                  disabled={removeAllMembersMutation.isPending}
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  {removeAllMembersMutation.isPending ? "Removing..." : "Remove All Members"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search members by name, email, or UFID..."
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Members List */}
                <div className="lg:col-span-2">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredMembers.map((member) => {
                      // Calculate absence count from absences data
                      const absenceCount = absences.filter(absence => 
                        absence.applicationId === member.id && absence.isActive
                      ).length;

                      // Determine card color based on absence count
                      const getCardColor = (count: number) => {
                        if (count === 0) return "border-green-300 bg-green-50"; // Green - No absences
                        if (count === 1) return "border-yellow-300 bg-yellow-50"; // Yellow - 1 absence
                        if (count === 2) return "border-orange-300 bg-orange-50"; // Orange - 2 absences
                        return "border-red-300 bg-red-50"; // Red - 3+ absences
                      };

                      const getAbsenceStatus = (count: number) => {
                        if (count === 0) return { text: "Good Standing", color: "text-green-700" };
                        if (count === 1) return { text: "1 Absence", color: "text-yellow-700" };
                        if (count === 2) return { text: "2 Absences", color: "text-orange-700" };
                        return { text: `${count} Absences`, color: "text-red-700" };
                      };

                      const status = getAbsenceStatus(absenceCount);

                      return (
                        <Card 
                          key={member.id} 
                          className={`p-3 cursor-pointer transition-colors border-2 ${getCardColor(absenceCount)} ${
                            selectedMember?.id === member.id ? "ring-2 ring-blue-400" : "hover:shadow-md"
                          }`}
                          onClick={() => setSelectedMember(member)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{member.fullName}</h4>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${status.color} border-current`}
                                >
                                  {status.text}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{member.email}</p>
                              <p className="text-xs text-gray-500">
                                {getTeamName(member.assignedTeamId)} | UFID: {member.ufid}
                              </p>
                            </div>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to remove ${member.fullName} from the system?`)) {
                                    handleDeleteMember(member.id);
                                  }
                                }}
                                disabled={deleteMemberMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Member Details Panel */}
                <div>
                  {selectedMember ? (
                    <Card className="p-4">
                      <h4 className="font-semibold mb-3">Member Details</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Name:</strong> {selectedMember.fullName}</div>
                        <div><strong>Email:</strong> {selectedMember.email}</div>
                        <div><strong>UFID:</strong> {selectedMember.ufid}</div>
                        <div><strong>Team:</strong> {getTeamName(selectedMember.assignedTeamId)}</div>
                        <div><strong>Status:</strong> {selectedMember.status}</div>
                        <div><strong>Submitted:</strong> {new Date(selectedMember.submittedAt).toLocaleDateString()}</div>

                        {selectedMember.skills && (
                          <div>
                            <strong>Skills:</strong>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {(selectedMember.skills as string[]).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Absence Management */}
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <h5 className="font-medium text-sm">Absences</h5>
                            <Badge variant="outline">
                              {absences.filter(absence => 
                                absence.applicationId === selectedMember.id && absence.isActive
                              ).length}
                            </Badge>
                          </div>

                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {absences
                              .filter(absence => absence.applicationId === selectedMember.id && absence.isActive)
                              .map(absence => (
                                <div key={absence.id} className="text-xs p-2 bg-gray-50 rounded flex justify-between items-center">
                                  <div>
                                    <div className="font-medium">
                                      {new Date(absence.startDate).toLocaleDateString()}
                                    </div>
                                    {absence.reason && (
                                      <div className="text-gray-500">{absence.reason}</div>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={async () => {
                                      try {
                                        await fetch(`/api/absences/${absence.id}`, {
                                          method: 'DELETE'
                                        });
                                        toast({ title: "Absence removed successfully" });
                                        queryClient.invalidateQueries({ queryKey: ['/api/absences'] });
                                        queryClient.invalidateQueries({ queryKey: ['/api/accepted-members'] });
                                      } catch (error) {
                                        toast({ title: "Failed to remove absence", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            {absences.filter(absence => 
                              absence.applicationId === selectedMember.id && absence.isActive
                            ).length === 0 && (
                              <div className="text-sm text-gray-500">No absences recorded</div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={async () => {
                                const reason = prompt("Reason for absence (optional):");
                                const date = new Date().toISOString().split('T')[0];

                                try {
                                  await fetch('/api/absences', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      applicationId: selectedMember.id,
                                      reason: reason || '',
                                      startDate: date
                                    })
                                  });
                                  toast({ title: "Absence added successfully" });
                                  queryClient.invalidateQueries({ queryKey: ['/api/absences'] });
                                  queryClient.invalidateQueries({ queryKey: ['/api/accepted-members'] });
                                } catch (error) {
                                  toast({ title: "Failed to add absence", variant: "destructive" });
                                }
                              }}
                            >
                              <CalendarX className="w-4 h-4 mr-2" />
                              Add Absence
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-4">
                      <p className="text-gray-500 text-center">
                        Select a member to view details
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Application Submissions</CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={() => autoAssignMutation.mutate()} 
                  variant="default" 
                  size="sm"
                  disabled={autoAssignMutation.isPending}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {autoAssignMutation.isPending ? "Assigning..." : "Auto Assign Teams"}
                </Button>
                <Button onClick={handleExportApplications} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  onClick={() => {
                    if (confirm("Are you sure you want to delete ALL submissions? This action cannot be undone.")) {
                      // Delete all applications that are not assigned
                      const deletePromises = filteredApplications.map(app => 
                        apiRequest("DELETE", `/api/applications/${app.id}`)
                      );
                      Promise.all(deletePromises).then(() => {
                        toast({
                          title: "All Submissions Deleted",
                          description: `${filteredApplications.length} submissions have been deleted.`,
                        });
                        queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
                      }).catch(() => {
                        toast({
                          title: "Error",
                          description: "Failed to delete all submissions.",
                          variant: "destructive",
                        });
                      });
                    }
                  }}
                  variant="destructive" 
                  size="sm"
                  disabled={filteredApplications.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove All Submissions
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search applications by name, email, or UFID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="waitlisted">Waitlisted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredApplications.map((application) => (
                  <Card key={application.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{application.fullName}</h4>
                          <Badge variant={
                            application.status === "accepted" ? "default" :
                            application.status === "waitlisted" ? "secondary" :
                            application.status === "rejected" ? "destructive" : "outline"
                          }>
                            {application.status}
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div>{application.email} | UFID: {application.ufid}</div>
                          <div>Assigned Team: {getTeamName(application.assignedTeamId)}</div>
                          <div>Submitted: {new Date(application.submittedAt).toLocaleDateString()}</div>

                          {application.teamPreferences && application.teamPreferences.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs font-medium text-gray-700">Team Preferences:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {application.teamPreferences.map((teamId, index) => (
                                  <Badge key={teamId} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-800">
                                    #{index + 1} {getTeamName(teamId)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Select 
                          value={application.status} 
                          onValueChange={(status) => handleUpdateApplicationStatus(application.id, status)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="assigned">Assign</SelectItem>
                            <SelectItem value="waitlisted">Waitlist</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteApplication(application.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Project Requests</CardTitle>
                <CardDescription>
                  Manage submitted project requests
                </CardDescription>
              </div>
              <Button 
                onClick={() => {
                  if (confirm("Are you sure you want to delete ALL project requests? This action cannot be undone.")) {
                    const deletePromises = projectRequests.map(project => 
                      apiRequest("DELETE", `/api/project-requests/${project.id}`)
                    );
                    Promise.all(deletePromises).then(() => {
                      toast({
                        title: "All Project Requests Deleted",
                        description: `${projectRequests.length} project requests have been deleted.`,
                      });
                      queryClient.invalidateQueries({ queryKey: ["/api/project-requests"] });
                    }).catch(() => {
                      toast({
                        title: "Error",
                        description: "Failed to delete all project requests.",
                        variant: "destructive",
                      });
                    });
                  }
                }}
                variant="destructive" 
                size="sm"
                disabled={!projectRequests || projectRequests.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove All Projects
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectRequests?.map((request) => (
                  <Card key={request.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{request.projectTitle}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            request.status === "approved" ? "default" :
                            request.status === "rejected" ? "destructive" :
                            request.status === "reaching_out" ? "secondary" : "outline"
                          }>
                            {request.status === "reaching_out" ? "Reaching Out" : request.status}
                          </Badge>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteProjectRequestMutation.mutate(request.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600">{request.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
                        <div>Submitted by: {request.fullName} ({request.email})</div>
                        <div>Phone: {request.phone || 'Not provided'}</div>
                        {request.address && (
                          <div className="md:col-span-2">Address: {request.address}</div>
                        )}
                        <div>Submitted: {new Date(request.submittedAt).toLocaleDateString()}</div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <Select 
                          value={request.status} 
                          onValueChange={(status) => {
                            if (status === "reaching_out") {
                              // Prompt for responsible person name
                              const responsiblePerson = prompt("Enter the name of the person responsible for reaching out:");
                              if (responsiblePerson) {
                                handleUpdateProjectRequest(request.id, { status });
                              }
                            } else {
                              handleUpdateProjectRequest(request.id, { status });
                            }
                          }}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="reaching_out">Reaching Out</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>

                        {request.status === "reaching_out" && (
                          <Input
                            placeholder="Update responsible person"
                            className="w-48"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const target = e.target as HTMLInputElement;
                                if (target.value.trim()) {
                                  handleUpdateProjectRequest(request.id, { 
                                    status: "reaching_out" 
                                  });
                                  target.value = "";
                                }
                              }
                            }}
                          />
                        )}

                        {request.status === "approved" && (
                          <Button
                            size="sm"
                            onClick={() => handleConvertToTeam(request)}
                            disabled={convertToTeamMutation.isPending}
                          >
                            {convertToTeamMutation.isPending ? "Converting..." : "Convert to Team"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}

                {(!projectRequests || projectRequests.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No project requests submitted yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Domain Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Domain Configuration</CardTitle>
                <CardDescription>
                  Manage allowed email domains for applications (@ufl.edu examples)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">student@ufl.edu</div>
                      <div className="text-sm text-gray-500">University of Florida students</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">alumni@ufl.edu</div>
                      <div className="text-sm text-gray-500">University of Florida alumni</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">faculty@ufl.edu</div>
                      <div className="text-sm text-gray-500">University of Florida faculty</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">staff@ufl.edu</div>
                      <div className="text-sm text-gray-500">University of Florida staff</div>
                    </div>
                    <Badge variant="secondary">Inactive</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex gap-2">
                    <Input placeholder="Add new domain (e.g., @ufl.edu)" className="flex-1" />
                    <Button size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Form Settings</CardTitle>
                <CardDescription>
                  Configure application deadlines and form behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Application Deadline</label>
                    <Input
                      type="date"
                      defaultValue="2024-02-15"
                      className="mt-1"
                      onChange={async (e) => {
                        try {
                          await fetch('/api/admin/settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              key: 'application_deadline',
                              value: e.target.value
                            })
                          });
                          toast({ title: "Deadline updated successfully" });
                        } catch (error) {
                          toast({ title: "Failed to update deadline", variant: "destructive" });
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Applications will be closed after this date
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Maximum Team Preferences</label>
                    <Input
                      type="number"
                      defaultValue="3"
                      min="1"
                      max="9"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum number of teams students can rank
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Require UFID Validation</div>
                      <div className="text-xs text-gray-500">Enforce 8-digit UFID format</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-gray-300"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Auto-assign Teams</div>
                      <div className="text-xs text-gray-500">Automatically assign students to teams</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-gray-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Form Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Overview of system health and configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Database</span>
                  </div>
                  <p className="text-xs text-gray-500">Connected and operational</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Applications</span>
                  </div>
                  <p className="text-xs text-gray-500">Form submissions active</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">Email Notifications</span>
                  </div>
                  <p className="text-xs text-gray-500">Not configured</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}