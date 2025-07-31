import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { Wand2, Eye, Trash2, CheckCircle, Clock, AlertTriangle, Users } from "lucide-react";
import type { ProjectRequest } from "../../../../shared/schema";

export default function ProjectsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projectRequests = [] } = useQuery<ProjectRequest[]>({
    queryKey: ["/api/project-requests"],
  });

  const convertToTeamMutation = useMutation({
    mutationFn: async ({ projectId, teamData }: { projectId: string; teamData: any }) => {
      const response = await apiRequest("POST", "/api/admin/convert-project-to-team", { projectId, teamData });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
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

  const deleteAllProjectsMutation = useMutation({
    mutationFn: async () => {
      const deletePromises = projectRequests.map(project =>
        apiRequest("DELETE", `/api/project-requests/${project.id}`)
      );
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-requests"] });
      toast({
        title: "All Projects Deleted",
        description: "All project requests have been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete all projects.",
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

  const handleDeleteAllProjects = () => {
    if (confirm("Are you sure you want to delete ALL project requests? This action cannot be undone.")) {
      deleteAllProjectsMutation.mutate();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "converted":
        return <Badge className="bg-blue-100 text-blue-800"><Users className="w-3 h-3 mr-1" />Converted to Team</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Project Requests</h2>
        <Button
          onClick={handleDeleteAllProjects}
          variant="destructive"
          size="sm"
          disabled={!projectRequests || projectRequests.length === 0 || deleteAllProjectsMutation.isPending}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {deleteAllProjectsMutation.isPending ? "Deleting..." : "Remove All Projects"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Request Management</CardTitle>
          <CardDescription>
            Review, approve, and convert project requests into teams ({projectRequests.length} requests)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!projectRequests || projectRequests.length === 0) ? (
            <div className="text-center py-12">
              <Wand2 className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Project Requests</h3>
              <p className="text-slate-500">
                Project requests will appear here when users submit them through the application form.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {projectRequests.map((request) => (
                <Card key={request.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-slate-900">{request.projectTitle}</h4>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mb-3">
                        <div>
                          <span className="font-medium">Submitted by:</span> {request.submitterName}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {request.submitterEmail}
                        </div>
                        <div>
                          <span className="font-medium">UFID:</span> {request.ufid}
                        </div>
                        <div>
                          <span className="font-medium">Submitted:</span> {new Date(request.submittedAt).toLocaleDateString()}
                        </div>
                      </div>

                      {request.description && (
                        <div className="mb-4">
                          <div className="text-sm font-medium text-slate-700 mb-1">Project Description:</div>
                          <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded border max-h-32 overflow-y-auto">
                            {request.description}
                          </div>
                        </div>
                      )}

                      {request.techStack && (
                        <div className="mb-4">
                          <div className="text-sm font-medium text-slate-700 mb-1">Technology Stack:</div>
                          <div className="text-sm text-slate-600">
                            {request.techStack}
                          </div>
                        </div>
                      )}

                      {request.teamSize && (
                        <div className="mb-4">
                          <div className="text-sm font-medium text-slate-700 mb-1">Requested Team Size:</div>
                          <div className="text-sm text-slate-600">
                            {request.teamSize} members
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Select
                        value={request.status}
                        onValueChange={(status) => handleUpdateProjectStatus(request.id, status)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>

                      {request.status === "approved" && (
                        <Button
                          size="sm"
                          onClick={() => handleConvertToTeam(request)}
                          disabled={convertToTeamMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          {convertToTeamMutation.isPending ? "Converting..." : "Convert to Team"}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteProject(request.id)}
                        disabled={deleteProjectMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Project Timeline/Status History */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                      {request.updatedAt && request.updatedAt !== request.createdAt && (
                        <span>Updated: {new Date(request.updatedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Statistics */}
      {projectRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Request Statistics</CardTitle>
            <CardDescription>Overview of project request statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-slate-900">
                  {projectRequests.filter(p => p.status === "pending").length}
                </div>
                <div className="text-sm text-slate-600">Pending</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {projectRequests.filter(p => p.status === "approved").length}
                </div>
                <div className="text-sm text-slate-600">Approved</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {projectRequests.filter(p => p.status === "rejected").length}
                </div>
                <div className="text-sm text-slate-600">Rejected</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {projectRequests.filter(p => p.status === "converted").length}
                </div>
                <div className="text-sm text-slate-600">Converted</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
