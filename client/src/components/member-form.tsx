import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertApplicationSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotebookPen, Info, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { z } from "zod";
import type { Team } from "@shared/schema";

type ApplicationFormData = z.infer<typeof insertApplicationSchema>;
type TimeAvailability = Record<string, boolean>;

const skillOptions = [
  "3D Modeling",
  "Programming", 
  "Electronics",
  "Research",
  "CAD Design",
  "Game Development",
];

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const timeSlots = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", 
  "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"
];

const acknowledgmentTexts = [
  "I understand there is a limit of one GRiP technical division team per GRiP member. The GRiP technical divison is comprised of 3D-Printed Hands and Assistive Devices Division, Adaptive Gaming Divison, and Research Divison.",
  "I will stick with my assigned team throughout the semester. If I feel the team is not the right fit for me, I can join a different team next school year.",
  "I can still participate in the outreach, marketing, 3D printing, and art teams if I join one of the technical division teams below. Example scenarios: (1) You can be on a hands team and the outreach team, (2) You can be on a gaming team and the 3D printing team and art team.",
  "I understand that team assignment will be first come, first serve. You may not get your number one preference and that is okay!! You will still gain valuable experience and meet new, cool people!",
  "I will join the GRiP Slack workspace to gain access to team communications and general GRiP announcements about socials, info sessions, and more.",
  "I understand that if there are no open team slots, I will be placed onto a waitlist.",
  "I understand that this form will close on Friday, January 31st, 2025 at 11:59pm (midnight).",
];

export default function MemberForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [teamPreferences, setTeamPreferences] = useState<string[]>([]);
  const [timeAvailability, setTimeAvailability] = useState<TimeAvailability>({});

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(insertApplicationSchema),
    defaultValues: {
      fullName: "",
      firstName: "",
      lastName: "",
      email: "",
      ufid: "",
      teamPreferences: [],
      skills: [],
      additionalSkills: "",
      timeAvailability: [],
      acknowledgments: new Array(7).fill(false),
    },
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams/type/technical"],
  });

  const { data: existingApplications = [] } = useQuery({
    queryKey: ["/api/applications"],
  });

  const submitMutation = useMutation({
    mutationFn: (data: ApplicationFormData) => {
      // Check for duplicates by email and UFID only
      const isDuplicate = existingApplications.some((app: any) => 
        app.email.toLowerCase() === data.email.toLowerCase() || 
        app.ufid === data.ufid
      );
      
      if (isDuplicate) {
        throw new Error("An application with this email address or UFID already exists.");
      }
      
      return apiRequest("POST", "/api/applications", data);
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "Your application has been submitted successfully. You will receive a confirmation email shortly.",
      });
      form.reset();
      setSelectedSkills([]);
      setTeamPreferences([]);
      setTimeAvailability({});
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleTimeSlot = (day: string, time: string) => {
    const key = `${day}-${time}`;
    setTimeAvailability(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isTimeSlotSelected = (day: string, time: string) => {
    const key = `${day}-${time}`;
    return timeAvailability[key] || false;
  };

  const moveTeamPreference = (index: number, direction: 'up' | 'down') => {
    const newPreferences = [...teamPreferences];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < newPreferences.length) {
      [newPreferences[index], newPreferences[newIndex]] = [newPreferences[newIndex], newPreferences[index]];
      setTeamPreferences(newPreferences);
    }
  };

  const removeTeamPreference = (index: number) => {
    const newPreferences = teamPreferences.filter((_, i) => i !== index);
    setTeamPreferences(newPreferences);
  };

  const onSubmit = (data: ApplicationFormData) => {
    // Convert grid selections to time slots format
    const timeSlotData = Object.entries(timeAvailability)
      .filter(([_, selected]) => selected)
      .map(([key, _]) => {
        const [day, time] = key.split('-');
        return { day, startTime: time, endTime: time };
      });
    
    const formData = {
      ...data,
      fullName: `${data.firstName} ${data.lastName}`.trim(),
      skills: selectedSkills,
      teamPreferences,
      timeAvailability: timeSlotData,
    };
    submitMutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Join a Technical Division Team
          </CardTitle>
          <CardDescription>
            Complete this form to join one of our technical division teams for Spring 2025.
          </CardDescription>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Form closes on Friday, January 31st, 2025 at 11:59pm (midnight)
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your first name" />
                        </FormControl>
                        <FormMessage className="text-red-600" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your last name" />
                        </FormControl>
                        <FormMessage className="text-red-600" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="example@ufl.edu" />
                      </FormControl>
                      <p className="text-xs text-slate-500">Must use approved domain (configured by admin)</p>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ufid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UFID *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12345678" />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Team Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  Team Preferences
                </h3>
                <p className="text-sm text-slate-600">
                  Select up to 9 teams in order of preference. Higher preferences will be considered first during assignment.
                </p>
                
                <div className="space-y-3">
                  {teamPreferences.length > 0 && (
                    <div className="space-y-2">
                      {teamPreferences.map((teamId, index) => {
                        const team = teams.find(t => t.id === teamId);
                        return (
                          <div key={`${teamId}-${index}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center">
                              <span className="text-sm font-medium bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3">
                                {index + 1}
                              </span>
                              <span className="font-medium">{team?.name || "Unknown Team"}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => moveTeamPreference(index, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => moveTeamPreference(index, 'down')}
                                disabled={index === teamPreferences.length - 1}
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTeamPreference(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {teamPreferences.length < 9 && (
                    <div>
                      <FormLabel>Add Team Preference</FormLabel>
                      <Select
                        onValueChange={(teamId) => {
                          if (!teamPreferences.includes(teamId)) {
                            setTeamPreferences([...teamPreferences, teamId]);
                          }
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select a team to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams
                            .filter(team => !teamPreferences.includes(team.id))
                            .map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                                {team.description && (
                                  <span className="text-xs text-slate-500 block">{team.description}</span>
                                )}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {teamPreferences.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
                      No team preferences selected. Click above to add your first preference.
                    </p>
                  )}
                </div>

                <div>
                  <FormLabel>Skills & Experience</FormLabel>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {skillOptions.map((skill) => (
                      <label key={skill} className="flex items-center">
                        <Checkbox
                          checked={selectedSkills.includes(skill)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSkills([...selectedSkills, skill]);
                            } else {
                              setSelectedSkills(selectedSkills.filter(s => s !== skill));
                            }
                          }}
                        />
                        <span className="ml-2 text-sm">{skill}</span>
                      </label>
                    ))}
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="additionalSkills"
                    render={({ field }) => (
                      <FormItem className="mt-3">
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={3} 
                            placeholder="Describe any additional skills or experience..."
                          />
                        </FormControl>
                        <FormMessage className="text-red-600" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Time Availability */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  Time Availability
                </h3>
                <p className="text-sm text-slate-600">
                  Select the time slots when you are available. Click on the boxes to select/deselect times.
                </p>
                
                <div className="overflow-x-auto">
                  <div className="min-w-[900px]">
                    {/* Header row with days */}
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      <div className="p-2"></div> {/* Empty corner */}
                      {daysOfWeek.map((day) => (
                        <div key={day} className="p-2 text-xs font-medium text-center text-slate-600 bg-slate-50 rounded">
                          {day.slice(0, 3)}
                        </div>
                      ))}
                    </div>
                    
                    {/* Time slots and availability grid */}
                    {timeSlots.map((time) => (
                      <div key={time} className="grid grid-cols-8 gap-1 mb-1">
                        <div className="p-2 text-sm font-medium text-slate-700 bg-slate-50 rounded flex items-center justify-end pr-3">
                          {time}
                        </div>
                        {daysOfWeek.map((day) => (
                          <button
                            key={`${day}-${time}`}
                            type="button"
                            onClick={() => toggleTimeSlot(day, time)}
                            className={`p-2 rounded border transition-colors ${
                              isTimeSlotSelected(day, time)
                                ? 'bg-blue-500 border-blue-600 text-white'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="w-full h-4"></div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-xs text-slate-500">
                  Selected {Object.values(timeAvailability).filter(Boolean).length} time slots
                </div>
              </div>

              {/* Required Acknowledgments */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  Required Acknowledgments
                </h3>
                <p className="text-sm text-slate-600">
                  Please read and acknowledge GRiP's Team Joining Rules by checking the following boxes:
                </p>
                
                <div className="space-y-4">
                  {acknowledgmentTexts.map((text, index) => (
                    <FormField
                      key={index}
                      control={form.control}
                      name={`acknowledgments.${index}` as const}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm text-slate-700 font-normal">
                              {text}
                            </FormLabel>
                            <FormMessage className="text-red-600" />
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={submitMutation.isPending}
                  className="w-full grip-primary text-white hover:bg-cyan-700"
                >
                  <NotebookPen className="w-4 h-4 mr-2" />
                  {submitMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
