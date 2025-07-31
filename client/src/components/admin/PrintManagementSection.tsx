import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { Printer, Eye, Download, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function PrintManagementSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  const { data: printSubmissions = [] } = useQuery({
    queryKey: ["/api/print-submissions"],
  });

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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete submission.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Submitted</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-slate-100 text-slate-800";
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
          {!printSubmissions || (Array.isArray(printSubmissions) && printSubmissions.length === 0) ? (
            <div className="text-center py-12">
              <Printer className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500">No print submissions found</p>
              <p className="text-sm text-slate-400">Print requests will appear here when submitted</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-3 font-medium">Timestamp</th>
                    <th className="text-left p-3 font-medium">Submitter</th>
                    <th className="text-left p-3 font-medium">Request Type</th>
                    <th className="text-left p-3 font-medium">Team</th>
                    <th className="text-left p-3 font-medium">Deadline</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Progress</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(printSubmissions) ? printSubmissions : []).map((submission: any) => (
                    <tr key={submission.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="font-medium">{submission.submitterName}</div>
                          <div className="text-slate-600">{submission.emailAddress}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="capitalize">{submission.requestType?.replace('-', ' ')}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{submission.teamName || "Individual"}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">
                          {submission.deadline ? new Date(submission.deadline).toLocaleDateString() : "No deadline"}
                        </span>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
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
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadFilesMutation.mutate(submission.id)}
                            title="Download Files"
                            disabled={downloadFilesMutation.isPending}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this submission?")) {
                                deleteSubmissionMutation.mutate(submission.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            title="Delete Submission"
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

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>Print Submission Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Submitter</label>
                    <p className="text-sm">{selectedSubmission.submitterName}</p>
                    <p className="text-xs text-slate-600">{selectedSubmission.emailAddress}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Request Type</label>
                    <p className="text-sm capitalize">{selectedSubmission.requestType?.replace('-', ' ')}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Team</label>
                    <p className="text-sm">{selectedSubmission.teamName || "Individual Request"}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Deadline</label>
                    <p className="text-sm">
                      {selectedSubmission.deadline 
                        ? new Date(selectedSubmission.deadline).toLocaleDateString()
                        : "No specific deadline"
                      }
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Current Status</label>
                    <div className="mt-1">{getStatusBadge(selectedSubmission.status)}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Progress</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${selectedSubmission.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">{selectedSubmission.progress || 0}%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Submitted</label>
                    <p className="text-sm">{new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {selectedSubmission.description && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <div className="text-sm bg-slate-50 p-3 rounded border mt-1">
                    {selectedSubmission.description}
                  </div>
                </div>
              )}

              {selectedSubmission.additionalNotes && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Additional Notes</label>
                  <div className="text-sm bg-slate-50 p-3 rounded border mt-1">
                    {selectedSubmission.additionalNotes}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSubmission(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => downloadFilesMutation.mutate(selectedSubmission.id)}
                  disabled={downloadFilesMutation.isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Files
                </Button>
                <select
                  value={selectedSubmission.status}
                  onChange={(e) => {
                    updateStatusMutation.mutate({
                      id: selectedSubmission.id,
                      status: e.target.value,
                    });
                    setSelectedSubmission({...selectedSubmission, status: e.target.value});
                  }}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="submitted">Submitted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
