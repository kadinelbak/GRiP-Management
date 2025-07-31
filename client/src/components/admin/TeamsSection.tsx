import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { Plus, Edit2, Trash2, Users, Target, Settings } from "lucide-react";
import type { Team } from "../../../../shared/schema";

interface NewTeamForm {
  name: string;
  description: string;
  maxCapacity: number;
  requiredSkills: string;
}

export default function TeamsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState<NewTeamForm>({
    name: "",
    description: "",
    maxCapacity: 6,
    requiredSkills: "",
  });
  const [skillInput, setSkillInput] = useState("");

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: acceptedMembers = [] } = useQuery<any[]>({
    queryKey: ["/api/accepted-members"],
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: (teamData: NewTeamForm) => apiRequest("POST", "/api/teams", teamData),
    onSuccess: () => {
      toast({
        title: "Team Created",
        description: "New team has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create team.",
        variant: "destructive",
      });
    },
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Team> }) =>
      apiRequest("PUT", `/api/teams/${id}`, updates),
    onSuccess: () => {
      toast({
        title: "Team Updated",
        description: "Team has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setEditingTeam(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update team.",
        variant: "destructive",
      });
    },
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/teams/${id}`),
    onSuccess: () => {
      toast({
        title: "Team Deleted",
        description: "Team has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete team.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name.trim()) return;
    
    createTeamMutation.mutate(newTeam);
  };

  const handleUpdateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !newTeam.name.trim()) return;
    
    updateTeamMutation.mutate({ 
      id: editingTeam.id, 
      updates: newTeam 
    });
  };

  const handleDeleteTeam = (id: string) => {
    if (confirm("Are you sure you want to delete this team? This will remove all assignments.")) {
      deleteTeamMutation.mutate(id);
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setNewTeam({
      name: team.name,
      description: team.description || "",
      maxCapacity: team.maxCapacity,
      requiredSkills: team.requiredSkills || "",
    });
    setIsCreateDialogOpen(true);
  };

  const resetForm = () => {
    setNewTeam({
      name: "",
      description: "",
      maxCapacity: 6,
      requiredSkills: "",
    });
    setSkillInput("");
    setEditingTeam(null);
  };

  const addSkill = () => {
    if (skillInput.trim() && !newTeam.requiredSkills.includes(skillInput.trim())) {
      setNewTeam(prev => ({
        ...prev,
        requiredSkills: prev.requiredSkills ? `${prev.requiredSkills},${skillInput.trim()}` : skillInput.trim()
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const skills = newTeam.requiredSkills.split(',').filter(s => s.trim() !== skillToRemove);
    setNewTeam(prev => ({
      ...prev,
      requiredSkills: skills.join(',')
    }));
  };

  const getTeamMemberCount = (teamId: string) => {
    return acceptedMembers.filter((member: any) => member.teamId === teamId).length;
  };

  const getTeamMembers = (teamId: string) => {
    return acceptedMembers.filter((member: any) => member.teamId === teamId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Team Management</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTeam ? "Edit Team" : "Create New Team"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam} className="space-y-4">
              <div>
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter team name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="teamDescription">Description</Label>
                <Textarea
                  id="teamDescription"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter team description"
                  rows={3}
                />
              </div>
              
                <div>
                  <Label htmlFor="maxCapacity">Max Members</Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    min="1"
                    max="20"
                    value={newTeam.maxCapacity}
                    onChange={(e) => setNewTeam(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) || 6 }))}
                  />
                </div>              <div>
                <Label>Required Skills</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Add a skill"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill} size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {newTeam.requiredSkills.split(',').filter(s => s.trim()).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill.trim())}>
                      {skill.trim()} ×
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTeamMutation.isPending || updateTeamMutation.isPending}>
                  {editingTeam ? "Update Team" : "Create Team"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const memberCount = getTeamMemberCount(team.id);
          const members = getTeamMembers(team.id);
          
          return (
            <Card key={team.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {team.description || "No description provided"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEditTeam(team)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Team Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>{memberCount}/{team.maxCapacity} members</span>
                    </div>
                    <Badge variant={memberCount === team.maxCapacity ? "default" : "secondary"}>
                      {memberCount === team.maxCapacity ? "Full" : "Open"}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(memberCount / team.maxCapacity) * 100}%` }}
                    ></div>
                  </div>

                  {/* Required Skills */}
                  {team.requiredSkills && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium">Required Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {team.requiredSkills.split(',').filter(s => s.trim()).slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill.trim()}
                          </Badge>
                        ))}
                        {team.requiredSkills.split(',').filter(s => s.trim()).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{team.requiredSkills.split(',').filter(s => s.trim()).length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Team Members */}
                  {members.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Team Members</div>
                      <div className="space-y-1">
                        {members.slice(0, 3).map((member: any, index: number) => (
                          <div key={index} className="text-xs text-slate-600 truncate">
                            {member.fullName}
                          </div>
                        ))}
                        {members.length > 3 && (
                          <div className="text-xs text-slate-500">
                            +{members.length - 3} more members
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {teams.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Settings className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Teams Created</h3>
            <p className="text-slate-500 mb-4">
              Create your first team to start organizing your organization
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
