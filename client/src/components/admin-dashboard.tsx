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
import { 
  BarChart3, Users, Inbox, Settings, Plus, Download, 
  Wand2, Eye, Edit, Trash2, CheckCircle, Clock 
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

  const { data: projectRequests = [] } = useQuery<ProjectRequest[]>({
    queryKey: ["/api/project-requests"],
  });

  const createTeamMutation = useMutation({
    mutationFn: (data: TeamFormData) => apiRequest("POST", "/api/teams", data),
    onSuccess: () => {
      toast({ title: "Team created successfully!" });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({ title: "Failed to create team", variant: "destructive" });
    },
  });

  const assignTeamsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/applications/assign-teams", {}),
    onSuccess: () => {
      toast({ title: "Teams assigned successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({ title: "Failed to assign teams", variant: "destructive" });
    },
  });

  const exportApplications = () => {
    window.open("/api/applications/export", "_blank");
  };

  const onSubmit = (data: TeamFormData) => {
    createTeamMutation.mutate(data);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-blue-100 text-blue-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "waitlisted": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-slate-900">Admin Dashboard</CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="grip-secondary text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Applications</p>
                      <p className="text-2xl font-bold">{stats?.totalApplications || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="grip-success text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Teams Filled</p>
                      <p className="text-2xl font-bold">{stats?.filledTeams || 0}/{stats?.totalTeams || 0}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="grip-accent text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Project Requests</p>
                      <p className="text-2xl font-bold">{stats?.totalProjectRequests || 0}</p>
                    </div>
                    <Settings className="w-8 h-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-500 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Additional Teams</p>
                      <p className="text-2xl font-bold">{stats?.totalAdditionalSignups || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {applications.slice(0, 3).map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                        <div>
                          <p className="font-medium">{app.fullName}</p>
                          <p className="text-sm text-slate-600">{teams.find(t => t.id === app.preferredTeamId)?.name || "No preference"}</p>
                        </div>
                        <Badge variant="outline">{new Date(app.submittedAt).toLocaleDateString()}</Badge>
                      </div>
                    ))}
                    {applications.length === 0 && (
                      <p className="text-slate-500 text-center py-4">No applications yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Capacity Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teams.filter(t => t.type === "technical").map((team) => (
                      <div key={team.id}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{team.name}</span>
                          <span className="text-sm text-slate-600">{team.currentSize}/{team.maxCapacity}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(team.currentSize / team.maxCapacity) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {teams.filter(t => t.type === "technical").length === 0 && (
                      <p className="text-slate-500 text-center py-4">No technical teams configured</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">Team Management</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Technical Division Teams</h4>
                <div className="space-y-3">
                  {teams.filter(t => t.type === "technical").map((team) => (
                    <Card key={team.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-medium text-slate-900">{team.name}</h5>
                            <p className="text-sm text-slate-600">Capacity: {team.currentSize}/{team.maxCapacity} members</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <p><strong>Meeting:</strong> {team.meetingTime || "Not specified"}</p>
                          <p><strong>Skills:</strong> {team.requiredSkills || "Not specified"}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {teams.filter(t => t.type === "technical").length === 0 && (
                    <p className="text-slate-500 text-center py-8">No technical teams created yet</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Add New Team</h4>
                <Card>
                  <CardContent className="p-4">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Team Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter team name" />
                              </FormControl>
                              <FormMessage />
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
                                <Input {...field} type="number" placeholder="15" />
                              </FormControl>
                              <FormMessage />
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
                                <Input {...field} placeholder="Tuesdays 6:00 PM - 8:00 PM" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="requiredSkills"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Required Skills</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} placeholder="List required or preferred skills..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          disabled={createTeamMutation.isPending}
                          className="w-full grip-primary text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">Member Applications</h3>
              <div className="flex space-x-3">
                <Button onClick={exportApplications} className="grip-success text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  onClick={() => assignTeamsMutation.mutate()}
                  disabled={assignTeamsMutation.isPending}
                  className="grip-secondary text-white"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {assignTeamsMutation.isPending ? "Assigning..." : "Auto-Assign Teams"}
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Preferred Team</TableHead>
                        <TableHead>Skills</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{app.fullName}</div>
                              <div className="text-sm text-slate-500">{app.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {teams.find(t => t.id === app.preferredTeamId)?.name || "No preference"}
                          </TableCell>
                          <TableCell>
                            {Array.isArray(app.skills) ? app.skills.join(", ") : "None"}
                          </TableCell>
                          <TableCell>
                            {new Date(app.submittedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(app.status)}>
                              {app.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              {app.status === "pending" && (
                                <Button variant="ghost" size="sm">
                                  Assign
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {applications.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                            No applications submitted yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">Project Requests</h3>
              <Button className="grip-success text-white">
                <Download className="w-4 h-4 mr-2" />
                Export Requests
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {projectRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-slate-900">{request.projectTitle}</h4>
                        <p className="text-sm text-slate-600">{request.fullName}</p>
                      </div>
                      <Badge className={getPriorityColor(request.priority)}>
                        {request.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 mb-3 line-clamp-3">{request.description}</p>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>Submitted: {new Date(request.submittedAt).toLocaleDateString()}</span>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {projectRequests.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-500">
                  No project requests submitted yet
                </div>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Platform Settings</h3>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Domain Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Allowed Email Domains</label>
                    <div className="flex space-x-2">
                      <Input className="flex-1" placeholder="@ufl.edu" defaultValue="@ufl.edu" />
                      <Button className="grip-primary text-white">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        @ufl.edu
                        <Button variant="ghost" size="sm" className="h-4 w-4 p-0">×</Button>
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Form Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Registration Deadline</label>
                    <Input type="datetime-local" defaultValue="2025-01-31T23:59" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="text-sm">Enable team registration</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="text-sm">Enable project requests</span>
                    </label>
                  </div>
                </CardContent>
              </Card>

              <div className="pt-4">
                <Button className="grip-primary text-white">
                  Save Settings
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
