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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, Users, Inbox, Settings, Plus, Download, 
  Wand2, Eye, Edit, Trash2, CheckCircle, Clock, UserMinus, Calendar, 
  CalendarX, Search, Filter, UserCheck
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

  const { data: projectRequests = [] } = useQuery<ProjectRequest[]>({
    queryKey: ["/api/project-requests"],
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

  const autoAssignMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/assign-teams", "POST"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });

      toast({
        title: "Auto Assignment Complete",
        description: `Successfully processed ${data.assignments?.length || 0} applications. Check the assignments for details.`,
      });
    },
    onError: () => {
      toast({
        title: "Assignment Failed",
        description: "Failed to automatically assign teams. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for auto-assigning teams
  const autoAssignTeamsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/assign-teams"),
    onSuccess: () => {
      toast({
        title: "Teams Assigned",
        description: "Teams have been automatically assigned based on preferences.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-members"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign teams.",
        variant: "destructive",
      });
    },
  });

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

  const handleAutoAssignTeams = () => {
    autoAssignTeamsMutation.mutate();
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
    mutationFn: ({ projectId, teamData }: { projectId: string; teamData: any }) => 
      apiRequest("/api/admin/convert-project-to-team", "POST", { projectId, teamData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-requests"] });
      toast({
        title: "Success",
        description: "Project converted to team successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to convert project to team",
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      apiRequest(`/api/project-requests/${id}`, "PUT", updates),
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
    mutationFn: (id: string) => apiRequest(`/api/project-requests/${id}`, "DELETE"),
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
      currentSize: 0,
      meetingTime: "TBD",
      requiredSkills: project.description, // Use description as skills info
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

  // Filter applications based on search and status
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.ufid.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Users className="w-4 h-4 mr-2" />
            Teams
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
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create Team Form */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Create New Team</h3>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Design Team" />
                            </FormControl>
                            <FormMessage className="text-red-600" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select team type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="additional">Additional</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-600" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxCapacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Capacity</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" onChange={e => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage className="text-red-600" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="meetingTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meeting Time</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Tuesdays 7:00 PM - 8:30 PM" value={field.value || ""} />
                            </FormControl>
                            <FormMessage className="text-red-600" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Team description..." value={field.value || ""} />
                            </FormControl>
                            <FormMessage className="text-red-600" />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={createTeamMutation.isPending}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                      </Button>
                    </form>
                  </Form>
                </div>

                {/* Teams List */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Existing Teams</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {teams.map((team) => (
                      <Card key={team.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{team.name}</h4>
                            <p className="text-sm text-gray-600">{team.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Capacity: {team.currentSize}/{team.maxCapacity} | {team.meetingTime}
                            </p>
                          </div>
                          <Badge variant={team.type === "technical" ? "default" : "secondary"}>
                            {team.type}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Assignments - Only Accepted Members */}
          <Card>
            <CardHeader>
              <CardTitle>Team Assignments (Accepted Members Only)</CardTitle>
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
                          {teamMembers.map((member) => (
                            <div key={member.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium">{member.fullName}</span>
                                <span className="text-sm text-gray-500 ml-2">({member.email})</span>
                              </div>
                              <span className="text-xs text-gray-500">{member.ufid}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No accepted members assigned</p>
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
              <CardTitle>Current Members (Accepted)</CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleExportMembers} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
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
                    {filteredMembers.map((member) => (
                      <Card 
                        key={member.id} 
                        className={`p-3 cursor-pointer transition-colors ${
                          selectedMember?.id === member.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedMember(member)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{member.fullName}</h4>
                            <p className="text-sm text-gray-600">{member.email}</p>
                            <p className="text-xs text-gray-500">
                              {getTeamName(member.assignedTeamId)} | UFID: {member.ufid}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMember(member.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
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

                        <div className="mt-4 space-y-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => {
                              // TODO: Implement absence management
                              toast({
                                title: "Coming Soon",
                                description: "Absence management will be implemented soon.",
                              });
                            }}
                          >
                            <CalendarX className="w-4 h-4 mr-2" />
                            Add Absence
                          </Button>
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
                  onClick={handleAutoAssignTeams} 
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
                    <SelectItem value="accepted">Accepted</SelectItem>
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
                            <div>
                              Team Preferences: {application.teamPreferences.map(teamId => getTeamName(teamId)).join(", ")}
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
                            <SelectItem value="accepted">Accept</SelectItem>
                            <SelectItem value="waitlisted">Waitlist</SelectItem>
                            <SelectItem value="rejected">Reject</SelectItem>
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
            <CardHeader>
              <CardTitle>Project Requests</CardTitle>
              <CardDescription>
                Manage submitted project requests
              </CardDescription>
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
                        <div>Submitted by: {request.submitterName} ({request.submitterEmail})</div>
                        <div>Organization: {request.organizationName}</div>
                        {request.organizationWebsite && (
                          <div className="md:col-span-2">
                            Website: <a href={request.organizationWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {request.organizationWebsite}
                            </a>
                          </div>
                        )}
                        {request.address && (
                          <div className="md:col-span-2">Address: {request.address}</div>
                        )}
                        <div>Submitted: {new Date(request.submittedAt).toLocaleDateString()}</div>
                        {request.responsiblePerson && (
                          <div>Responsible: {request.responsiblePerson}</div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <Select 
                          value={request.status} 
                          onValueChange={(status) => {
                            if (status === "reaching_out") {
                              // Prompt for responsible person name
                              const responsiblePerson = prompt("Enter the name of the person responsible for reaching out:");
                              if (responsiblePerson) {
                                handleUpdateProjectRequest(request.id, { status, responsiblePerson });
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
                                    responsiblePerson: target.value.trim() 
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
                            onClick={() => {
                              // Convert to team logic would go here
                              toast({
                                title: "Feature Coming Soon",
                                description: "Team conversion feature will be available soon.",
                              });
                            }}
                          >
                            Convert to Team
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
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Domain Configuration</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage allowed email domains for applications
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Domains (Coming Soon)
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Form Settings</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Adjust form validation and submission settings
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    <Edit className="w-4 h-4 mr-2" />
                    Form Settings (Coming Soon)
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Team Assignment Algorithm</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure automatic team assignment settings
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Algorithm Settings (Coming Soon)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}