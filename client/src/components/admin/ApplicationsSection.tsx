import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { Search, Filter, Eye, Trash2, CheckCircle, Clock, UserMinus, Download, Wand2 } from "lucide-react";
import type { Application, Team } from "../../../../shared/schema";

export default function ApplicationsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
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

  const handleDeleteApplication = (id: string) => {
    if (confirm("Are you sure you want to delete this application?")) {
      deleteApplicationMutation.mutate(id);
    }
  };

  const handleUpdateApplicationStatus = (id: string, status: string) => {
    updateApplicationMutation.mutate({ id, updates: { status } });
  };

  const handleExportApplications = () => {
    window.open("/api/export/applications", "_blank");
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

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return "Unassigned";
    const team = teams.find(t => t.id === teamId);
    return team?.name || "Unknown Team";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "assigned":
        return <Badge className="bg-green-100 text-green-800">Assigned</Badge>;
      case "waitlisted":
        return <Badge className="bg-yellow-100 text-yellow-800">Waitlisted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Application Management</h2>
        <div className="flex gap-2">
          <Button onClick={handleExportApplications} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Applications
          </Button>
          <Button 
            onClick={() => autoAssignMutation.mutate()}
            disabled={autoAssignMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {autoAssignMutation.isPending ? "Assigning..." : "Auto Assign Teams"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or UFID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Applications</CardTitle>
          <CardDescription>
            Review and manage team applications ({filteredApplications.length} applications)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="text-center py-8">
              <UserMinus className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500">No applications found</p>
              <p className="text-sm text-slate-400">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-3 font-medium">Applicant</th>
                    <th className="text-left p-3 font-medium">Contact</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Team Preferences</th>
                    <th className="text-left p-3 font-medium">Skills</th>
                    <th className="text-left p-3 font-medium">Submitted</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((application) => (
                    <tr key={application.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-slate-900">{application.fullName}</div>
                          <div className="text-sm text-slate-600">UFID: {application.ufid}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-slate-600">{application.email}</div>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(application.status)}
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {application.teamPreferences?.slice(0, 3).map((teamId, index) => (
                            <div key={index} className="text-xs">
                              {index + 1}. {getTeamName(teamId)}
                            </div>
                          ))}
                          {application.teamPreferences && application.teamPreferences.length > 3 && (
                            <div className="text-xs text-slate-500">
                              +{application.teamPreferences.length - 3} more
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {application.skills?.slice(0, 2).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {application.skills && application.skills.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{application.skills.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-slate-600">
                          {new Date(application.submittedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {/* TODO: Add view details modal */}}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Select 
                            value={application.status} 
                            onValueChange={(status) => handleUpdateApplicationStatus(application.id, status)}
                          >
                            <SelectTrigger className="w-20 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="waitlisted">Waitlisted</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteApplication(application.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            title="Delete Application"
                          >
                            <Trash2 className="w-4 h-4" />
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
  );
}
