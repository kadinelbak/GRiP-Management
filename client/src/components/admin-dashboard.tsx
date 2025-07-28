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
  CalendarX, Search, Filter, UserCheck, Save, X, Printer, Camera
} from "lucide-react";
import type { Team, Application, ProjectRequest } from "@shared/schema";
import type { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["/api/events"],
  });

  const { data: eventAttendance = [] } = useQuery<any[]>({
    queryKey: ["/api/event-attendance"],
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

  // Event attendance approval mutation
  const approveAttendanceMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PUT", `/api/event-attendance/${id}/approve`),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/event-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Attendance Approved",
        description: data.message || "Attendance approved and points added",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve attendance",
        variant: "destructive",
      });
    },
  });

  const rejectAttendanceMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PUT", `/api/event-attendance/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/event-attendance"] });
      toast({
        title: "Attendance Rejected",
        description: "Attendance has been rejected",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject attendance",
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

  // Print Management Section
function PrintManagementSection() {
  const { data: printSubmissions = [] } = useQuery({
    queryKey: ["/api/print-submissions"],
  });

  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, progress }: { id: string; status: string; progress?: number }) =>
      apiRequest("PUT", `/api/print-submissions/${id}`, { status, progress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/print-submissions"] });
      toast({
        title: "Status Updated",
        description: "Print submission status has been updated.",
      });
    },
  });

  const downloadFilesMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const response = await fetch(`/api/print-submissions/${submissionId}/download`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to download files");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `print-submission-${submissionId}-files.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Download Started",
        description: "Files are being downloaded.",
      });
    },
    onError: () => {
      toast({
        title: "Download Failed",
        description: "Failed to download files.",
        variant: "destructive",
      });
    },
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/print-submissions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/print-submissions"] });
      toast({
        title: "Submission Deleted",
        description: "Print submission has been deleted.",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-emerald-100 text-emerald-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Print Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Print Submissions Overview</CardTitle>
          <CardDescription>Manage and track all 3D print requests</CardDescription>
        </CardHeader>
        <CardContent>
          {!printSubmissions || printSubmissions.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No print submissions found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-3">Timestamp</th>
                    <th className="text-left p-3">Submitter</th>
                    <th className="text-left p-3">Request Type</th>
                    <th className="text-left p-3">Team</th>
                    <th className="text-left p-3">Deadline</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Progress</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {printSubmissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-slate-900">{submission.submitterName}</div>
                          <div className="text-sm text-slate-500">{submission.emailAddress}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="capitalize">{submission.requestType.replace('-', ' ')}</span>
                      </td>
                      <td className="p-3">{submission.teamName || "N/A"}</td>
                      <td className="p-3">
                        {submission.deadline ? (
                          <div className="text-sm">
                            <div>{new Date(submission.deadline).toLocaleDateString()}</div>
                            <div className="text-slate-500">{new Date(submission.deadline).toLocaleTimeString()}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">No deadline</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusColor(submission.status)}`}>
                          {submission.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${submission.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-600">{submission.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadFilesMutation.mutate(submission.id)}
                            disabled={downloadFilesMutation.isPending}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteSubmissionMutation.mutate(submission.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Print Submission Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Submitter Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {selectedSubmission.submitterName}</p>
                      <p><span className="font-medium">Email:</span> {selectedSubmission.emailAddress}</p>
                      <p><span className="font-medium">Team:</span> {selectedSubmission.teamName || "N/A"}</p>
                      <p><span className="font-medium">Submitted:</span> {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Request Details</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Type:</span> {selectedSubmission.requestType.replace("-", " ")}</p>
                      <p><span className="font-medium">Status:</span> {selectedSubmission.status.replace("_", " ")}</p>
                      <p><span className="font-medium">Progress:</span> {selectedSubmission.progress || 0}%</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Update Status</h3>
                    <div className="space-y-3">
                      <Select 
                        value={selectedSubmission.status} 
                        onValueChange={(status) => 
                          updateStatusMutation.mutate({ 
                            id: selectedSubmission.id, 
                            status,
                            progress: selectedSubmission.progress 
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Progress: {selectedSubmission.progress || 0}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={selectedSubmission.progress || 0}
                          onChange={(e) => {
                            const progress = parseInt(e.target.value);
                            updateStatusMutation.mutate({
                              id: selectedSubmission.id,
                              status: selectedSubmission.status,
                              progress
                            });
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedSubmission.generalPrintDescription && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                    {selectedSubmission.generalPrintDescription}
                  </p>
                </div>
              )}

              {selectedSubmission.fileSpecifications && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">File Specifications</h3>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                    {selectedSubmission.fileSpecifications}
                  </p>
                </div>
              )}

              {selectedSubmission.comments && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Comments</h3>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                    {selectedSubmission.comments}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => downloadFilesMutation.mutate(selectedSubmission.id)}
                  disabled={downloadFilesMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Files
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedSubmission(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Absence Management Section
function AbsenceManagementSection() {
  return (
    <div>
      Absence Management Section Content
    </div>
  );
}

  const [activeSection, setActiveSection] = useState<"overview" | "applications" | "teams" | "members" | "projects" | "settings" | "event-attendance" | "print-management">("overview");

  const deleteAttendanceMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/event-attendance/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/event-attendance"] });
      toast({
        title: "Attendance Record Deleted",
        description: "Attendance record has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete attendance record.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">GRiP Admin Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <nav className="space-y-2">
            <Button
              variant={activeSection === "overview" ? "default" : "ghost"}
              onClick={() => setActiveSection("overview")}
              className="justify-start"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeSection === "applications" ? "default" : "ghost"}
              onClick={() => setActiveSection("applications")}
              className="justify-start"
            >
              <Inbox className="w-4 h-4 mr-2" />
              Applications
            </Button>
            <Button
              variant={activeSection === "teams" ? "default" : "ghost"}
              onClick={() => setActiveSection("teams")}
              className="justify-start"
            >
              <Users className="w-4 h-4 mr-2" />
              Teams
            </Button>
            <Button
              variant={activeSection === "members" ? "default" : "ghost"}
              onClick={() => setActiveSection("members")}
              className="justify-start"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Members
            </Button>
            <Button
              variant={activeSection === "projects" ? "default" : "ghost"}
              onClick={() => setActiveSection("projects")}
              className="justify-start"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Projects
            </Button>
            <Button
              variant={activeSection === "settings" ? "default" : "ghost"}
              onClick={() => setActiveSection("settings")}
              className="justify-start"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              variant={activeSection === "event-attendance" ? "default" : "ghost"}
              onClick={() => setActiveSection("event-attendance")}
              className="justify-start"
            >
              <Camera className="w-4 h-4 mr-2" />
              Event Attendance
            </Button>

            <Button
              variant={activeSection === "print-management" ? "default" : "ghost"}
              onClick={() => setActiveSection("print-management")}
              className="justify-start"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Management
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="space-y-6">
          {activeSection === "overview" && (
            <div className="space-y-6">
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
            </div>
          )}

          {activeSection === "applications" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Application Submissions</h2>
                <div className="flex gap-2">
                  <Button onClick={() => autoAssignMutation.mutate()} variant="default" size="sm" disabled={autoAssignMutation.isPending}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    {autoAssignMutation.isPending ? "Assigning..." : "Auto Assign Teams"}
                  </Button>
                  <Button onClick={handleExportApplications} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Application Submissions</CardTitle>
                  <CardDescription>Manage submitted applications</CardDescription>
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
            </div>
          )}

          {activeSection === "teams" && (
            <div className="space-y-6">
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
            </div>
          )}

          {activeSection === "members" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Members Management</h2>
                <div className="flex gap-2">
                  <Button onClick={handleExportMembers} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export Members CSV
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirm("Are you sure you want to remove ALL members from their teams? This action cannot be undone.")) {
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
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Active Members</CardTitle>
                  <CardDescription>
                    Members who have been assigned to teams
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Input
                      placeholder="Search members by name, email, or UFID..."
                      value={memberSearchTerm}
                      onChange={(e) => setMemberSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredMembers.map((member) => {
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
                        <Card key={member.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium">{member.fullName}</h4>
                                <Badge variant="default">Active</Badge>
                                {absenceCount > 0 && (
                                  <Badge variant="outline" className={`text-xs ${getAbsenceColor(absenceCount)} border-current`}>
                                    {absenceCount} absence{absenceCount !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>

                              <div className="text-sm text-gray-600 space-y-1">
                                <div>{member.email} | UFID: {member.ufid}</div>
                                <div>Team: {getTeamName(member.assignedTeamId)}</div>
                                <div>Joined: {new Date(member.submittedAt).toLocaleDateString()}</div>
                                
                                {member.skills && member.skills.length > 0 && (
                                  <div className="mt-2">
                                    <span className="text-xs font-medium text-gray-700">Skills:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {member.skills.map((skill, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedMember(member)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
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
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}

                    {filteredMembers.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        {memberSearchTerm ? "No members found matching your search." : "No active members found."}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Member Detail Modal */}
              {selectedMember && (
                <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Member Details</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-2">Personal Information</h3>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Name:</span> {selectedMember.fullName}</p>
                            <p><span className="font-medium">Email:</span> {selectedMember.email}</p>
                            <p><span className="font-medium">UFID:</span> {selectedMember.ufid}</p>
                            <p><span className="font-medium">Team:</span> {getTeamName(selectedMember.assignedTeamId)}</p>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold text-slate-900 mb-2">Application Details</h3>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Status:</span> {selectedMember.status}</p>
                            <p><span className="font-medium">Submitted:</span> {new Date(selectedMember.submittedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      {selectedMember.skills && selectedMember.skills.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-2">Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedMember.skills.map((skill, index) => (
                              <Badge key={index} variant="outline">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedMember.additionalSkills && (
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-2">Additional Skills</h3>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                            {selectedMember.additionalSkills}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedMember(null)}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}

          {activeSection === "projects" && (
            <div className="space-y-6">
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
            </div>
          )}

          {activeSection === "settings" && (
            <div className="space-y-6">
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
            </div>
          )}

          {activeSection === "event-attendance" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Event Attendance Management</h2>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Pending Submissions</CardTitle>
                  <CardDescription>Review and approve event attendance submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  {!eventAttendance || eventAttendance.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No pending submissions</p>
                  ) : (
                    <div className="space-y-4">
                      {eventAttendance
                        .filter(submission => submission.status === "pending")
                        .map((submission) => (
                          <div key={submission.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{submission.fullName}</h3>
                                <p className="text-sm text-slate-600">UFID: {submission.ufid}</p>
                                <p className="text-sm text-slate-600">
                                  Event: {submission.event?.title || "Unknown Event"}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (submission.photo) {
                                      window.open(submission.photo, '_blank');
                                    }
                                  }}
                                  variant="outline"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Photo
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => approveAttendanceMutation.mutate(submission.id)}
                                  disabled={approveAttendanceMutation.isPending}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => rejectAttendanceMutation.mutate(submission.id)}
                                  disabled={rejectAttendanceMutation.isPending}
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm text-slate-600">
                              <p>Social Media Permission: {submission.socialMediaPermission ? "Yes" : "No"}</p>
                              <p>Submitted: {new Date(submission.submittedAt).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Submissions</CardTitle>
                  <CardDescription>Complete history of event attendance submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  {!eventAttendance || eventAttendance.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No submissions found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left p-2">Name</th>
                            <th className="text-left p-2">UFID</th>
                            <th className="text-left p-2">Event</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Social Media</th>
                            <th className="text-left p-2">Submitted</th>
                            <th className="text-left p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eventAttendance.map((submission) => (
                            <tr key={submission.id} className="border-b border-slate-100">
                              <td className="p-2">{submission.fullName}</td>
                              <td className="p-2">{submission.ufid}</td>
                              <td className="p-2">{submission.event?.title || "Unknown"}</td>
                              <td className="p-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  submission.status === "approved" ? "bg-emerald-100 text-emerald-800" :
                                  submission.status === "rejected" ? "bg-red-100 text-red-800" :
                                  "bg-yellow-100 text-yellow-800"
                                }`}>
                                  {submission.status}
                                </span>
                              </td>
                              <td className="p-2">{submission.socialMediaPermission ? "Yes" : "No"}</td>
                              <td className="p-2">{new Date(submission.submittedAt).toLocaleDateString()}</td>
                              <td className="p-2">
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      if (submission.photo) {
                                        window.open(submission.photo, '_blank');
                                      }
                                    }}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteAttendanceMutation.mutate(submission.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "print-management" && (
            <PrintManagementSection />
          )}
        </main>
      </div>
    </div>
  );
}