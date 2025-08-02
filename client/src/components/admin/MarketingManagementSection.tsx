import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { 
  CheckCircle, XCircle, MessageSquare, Send, Calendar, User, Clock 
} from "lucide-react";

interface MarketingRequest {
  id: string;
  requestType: string;
  description: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requesterName: string;
  requesterEmail: string;
  createdAt: string;
  updatedAt: string;
}

export default function MarketingManagementSection() {
  const [requests, setRequests] = useState<MarketingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<MarketingRequest | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/marketing-requests${filter !== 'all' ? `?status=${filter}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch marketing requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: string, message?: string) => {
    try {
      const response = await fetch(`/api/marketing-requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ status: newStatus, responseMessage: message })
      });

      if (response.ok) {
        fetchRequests();
        setIsDetailsDialogOpen(false);
        setResponseMessage('');
      }
    } catch (error) {
      console.error('Failed to update request status:', error);
    }
  };

  const openRequestDetails = (request: MarketingRequest) => {
    setSelectedRequest(request);
    setIsDetailsDialogOpen(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading marketing requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Marketing Management</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Requests</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No marketing requests found for the selected filter.
          </div>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Send className="w-4 h-4" />
                    <h3 className="text-lg font-semibold">{request.requestType}</h3>
                    <Badge className={getStatusBadgeColor(request.status)}>
                      {request.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityBadgeColor(request.priority)}>
                      {request.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    By {request.requesterName} • {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700 mb-2 line-clamp-2">{request.description}</p>
                  {request.deadline && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      Deadline: {new Date(request.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openRequestDetails(request)}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  {request.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(request.id, 'in_progress')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Start Work
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(request.id, 'rejected')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {request.status === 'in_progress' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(request.id, 'completed')}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Request Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Marketing Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedRequest.requestType}</h3>
                <p className="text-sm text-gray-600">
                  Requested by {selectedRequest.requesterName} ({selectedRequest.requesterEmail})
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Description:</h4>
                <p className="text-gray-700">{selectedRequest.description}</p>
              </div>

              {selectedRequest.deadline && (
                <div>
                  <h4 className="font-medium mb-2">Deadline:</h4>
                  <p className="text-gray-700">{new Date(selectedRequest.deadline).toLocaleDateString()}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Badge className={getStatusBadgeColor(selectedRequest.status)}>
                  {selectedRequest.status.replace('_', ' ')}
                </Badge>
                <Badge className={getPriorityBadgeColor(selectedRequest.priority)}>
                  {selectedRequest.priority}
                </Badge>
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium">Response Message (Optional):</h4>
                  <Textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Add a message to the requester..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'in_progress', responseMessage)}
                      className="flex-1"
                    >
                      Start Work
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected', responseMessage)}
                      className="flex-1"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {selectedRequest.status === 'in_progress' && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium">Completion Message (Optional):</h4>
                  <Textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Add completion notes..."
                    rows={3}
                  />
                  <Button
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'completed', responseMessage)}
                    className="w-full"
                  >
                    Mark as Completed
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
