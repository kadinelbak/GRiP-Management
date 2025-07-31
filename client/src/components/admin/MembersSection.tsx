import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { Search, Filter, UserX, Download, Mail, Phone, Calendar, MapPin, Shuffle } from "lucide-react";
import type { Team } from "../../../../shared/schema";

// Extended interface for accepted members with team assignment
interface AcceptedMember {
  id: string;
  fullName: string;
  email: string;
  ufid: string;
  phoneNumber?: string;
  graduationYear?: number;
  skills: string[];
  teamId: string | null; // This maps to assignedTeamId in the database
  submittedAt: string;
}

export default function MembersSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("all");

  const { data: acceptedMembers = [] } = useQuery<AcceptedMember[]>({
    queryKey: ["/api/accepted-members"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => apiRequest("DELETE", `/api/accepted-members/${memberId}`),
    onSuccess: () => {
      toast({
        title: "Member Removed",
        description: "Member has been removed from the team.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove member.",
        variant: "destructive",
      });
    },
  });

  // Change team mutation
  const changeTeamMutation = useMutation({
    mutationFn: ({ memberId, teamId }: { memberId: string; teamId: string }) =>
      apiRequest("PUT", `/api/accepted-members/${memberId}/team`, { teamId }),
    onSuccess: () => {
      toast({
        title: "Team Updated",
        description: "Member's team assignment has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-members"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update team assignment.",
        variant: "destructive",
      });
    },
  });

  // Auto-sort members mutation
  const autoSortMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/auto-sort-members"),
    onSuccess: () => {
      toast({
        title: "Auto-Sort Complete",
        description: "Members have been automatically distributed across teams.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to auto-sort members.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (confirm(`Are you sure you want to remove ${memberName} from their team?`)) {
      removeMemberMutation.mutate(memberId);
    }
  };

  const handleChangeTeam = (memberId: string, teamId: string) => {
    changeTeamMutation.mutate({ memberId, teamId });
  };

  const handleAutoSort = () => {
    const unassignedCount = acceptedMembers.filter((member) => !member.teamId).length;
    if (unassignedCount === 0) {
      toast({
        title: "No Action Needed",
        description: "All members are already assigned to teams.",
      });
      return;
    }

    if (confirm(`Auto-sort ${unassignedCount} unassigned members across available teams?`)) {
      autoSortMutation.mutate();
    }
  };

  const handleExportMembers = () => {
    window.open("/api/export/members", "_blank");
  };

  // Filter members based on search and team
  const filteredMembers = acceptedMembers.filter((member) => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.ufid.includes(searchTerm);
    const matchesTeam = teamFilter === "all" || member.teamId === teamFilter;
    return matchesSearch && matchesTeam;
  });

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return "Unassigned";
    const team = teams.find(t => t.id === teamId);
    return team?.name || "Unknown Team";
  };

  const getTeamColor = (teamId: string | null) => {
    if (!teamId) return "bg-slate-100 text-slate-800";
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800", 
      "bg-purple-100 text-purple-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
    ];
    const team = teams.find(t => t.id === teamId);
    if (!team) return "bg-slate-100 text-slate-800";
    const index = teams.indexOf(team) % colors.length;
    return colors[index];
  };

  const getAvailableTeams = (currentTeamId: string | null) => {
    return teams.filter(team => {
      if (team.id === currentTeamId) return true; // Include current team
      const memberCount = acceptedMembers.filter((member) => member.teamId === team.id).length;
      return memberCount < team.maxCapacity; // Only include teams with space
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Member Management</h2>
        <div className="flex gap-2">
          <Button 
            onClick={handleAutoSort} 
            variant="default" 
            size="sm"
            disabled={autoSortMutation.isPending}
          >
            <Shuffle className="w-4 h-4 mr-2" />
            {autoSortMutation.isPending ? "Auto-Sorting..." : "Auto-Sort Members"}
          </Button>
          <Button onClick={handleExportMembers} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Members
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
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserX className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Members Found</h3>
            <p className="text-slate-500">
              {acceptedMembers.length === 0 
                ? "No members have been assigned to teams yet."
                : "Try adjusting your search or filter criteria."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{member.fullName}</CardTitle>
                    <Badge className={`mt-2 ${getTeamColor(member.teamId)}`}>
                      {getTeamName(member.teamId)}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveMember(member.id, member.fullName)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    title="Remove from team"
                  >
                    <UserX className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600 truncate">{member.email}</span>
                  </div>
                  {member.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600">{member.phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600">UFID: {member.ufid}</span>
                  </div>
                  {member.graduationYear && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600">Class of {member.graduationYear}</span>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {member.skills && member.skills.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Skills</div>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.slice(0, 3).map((skill: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {member.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{member.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Team Change */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Change Team</label>
                  <Select 
                    value={member.teamId || ""} 
                    onValueChange={(teamId) => handleChangeTeam(member.id, teamId)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTeams(member.teamId).map((team) => {
                        const memberCount = acceptedMembers.filter((m) => m.teamId === team.id).length;
                        const isCurrentTeam = team.id === member.teamId;
                        const isFull = memberCount >= team.maxCapacity && !isCurrentTeam;
                        
                        return (
                          <SelectItem 
                            key={team.id} 
                            value={team.id}
                            disabled={isFull}
                          >
                            {team.name} ({memberCount}/{team.maxCapacity})
                            {isFull && " - Full"}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Join Date */}
                <div className="text-xs text-slate-500 pt-2 border-t">
                  Joined: {new Date(member.submittedAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Team Summary */}
      {acceptedMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Distribution Summary</CardTitle>
            <CardDescription>Overview of member distribution across teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => {
                const memberCount = acceptedMembers.filter((member) => member.teamId === team.id).length;
                const percentage = Math.round((memberCount / acceptedMembers.length) * 100);
                
                return (
                  <div key={team.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{team.name}</span>
                      <Badge className={getTeamColor(team.id)}>
                        {memberCount}/{team.maxCapacity}
                      </Badge>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(memberCount / team.maxCapacity) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-slate-600">
                      {percentage}% of total members
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
