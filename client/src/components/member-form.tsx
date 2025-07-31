import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertApplicationSchema } from "../../../shared/schema";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { NotebookPen, Info, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { z } from "zod";
import type { Team } from "../../../shared/schema";

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
  const [selectedAdditionalTeams, setSelectedAdditionalTeams] = useState<string[]>([]);
  const [timeAvailability, setTimeAvailability] = useState<TimeAvailability>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{day: string, time: string} | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);


  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(insertApplicationSchema),
    defaultValues: {
      fullName: "",
      firstName: "",
      lastName: "",
      email: "",
      ufid: "",
      teamPreferences: [],
      additionalTeams: [],
      skills: [],
      additionalSkills: "",
      timeAvailability: [],
      acknowledgments: new Array(7).fill(false),
    },
  });

  const { data: technicalTeams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams/type/technical"],
  });

  const { data: constantTeams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams/type/constant"],
  });

  const { data: existingApplications = [] } = useQuery({
    queryKey: ["/api/applications"],
  });

  const submitMutation = useMutation({
    mutationFn: (data: ApplicationFormData) => {
      return apiRequest("POST", "/api/applications", data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "Your application has been submitted successfully. You will receive a confirmation email shortly.",
      });
      form.reset();
      setSelectedSkills([]);
      setTimeAvailability({});
      setTeamPreferences([]);
      setSelectedAdditionalTeams([]);
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
    setTimeAvailability(prev => {
      const newAvailability = {
        ...prev,
        [key]: !prev[key]
      };

      // Update form field
      const timeSlotData = Object.entries(newAvailability)
        .filter(([_, selected]) => selected)
        .map(([key, _]) => {
          const [day, time] = key.split('-');
          return { day, startTime: time, endTime: time };
        });

      form.setValue("timeAvailability", timeSlotData);
      return newAvailability;
    });
  };

  const isTimeSlotSelected = (day: string, time: string) => {
    const key = `${day}-${time}`;
    return timeAvailability[key] || false;
  };

  const handleMouseDown = (day: string, time: string) => {
    setIsDragging(true);
    setDragStart({day, time});
    toggleTimeSlot(day, time);
  };

  const handleMouseEnter = (day: string, time: string) => {
    if (isDragging && dragStart) {
      const key = `${day}-${time}`;
      const startKey = `${dragStart.day}-${dragStart.time}`;
      const shouldSelect = timeAvailability[startKey] || false;

      setTimeAvailability(prev => ({
        ...prev,
        [key]: shouldSelect
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const moveTeamPreference = (index: number, direction: 'up' | 'down') => {
    const newPreferences = [...teamPreferences];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < newPreferences.length) {
      [newPreferences[index], newPreferences[newIndex]] = [newPreferences[newIndex], newPreferences[index]];
      setTeamPreferences(newPreferences);
      form.setValue("teamPreferences", newPreferences);
    }
  };

  const removeTeamPreference = (index: number) => {
    const newPreferences = teamPreferences.filter((_, i) => i !== index);
    setTeamPreferences(newPreferences);
    form.setValue("teamPreferences", newPreferences);
  };

  const onSubmit = (data: ApplicationFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Team preferences:", teamPreferences);
    console.log("Time availability:", timeAvailability);
    console.log("Selected skills:", selectedSkills);

    // Convert grid selections to time slots format
    const timeSlotData = Object.entries(timeAvailability)
      .filter(([_, selected]) => selected)
      .map(([key, _]) => {
        const [day, time] = key.split('-');
        return { day, startTime: time, endTime: time };
      });

    // Override form data with component state values
    const formData = {
      ...data,
      fullName: `${data.firstName} ${data.lastName}`.trim(),
      skills: selectedSkills,
      teamPreferences: teamPreferences,
      additionalTeams: selectedAdditionalTeams,
      timeAvailability: timeSlotData,
    };

    // Validate that all acknowledgments are checked
    const allAcknowledged = formData.acknowledgments.every(ack => ack === true);
    if (!allAcknowledged) {
      console.log("Acknowledgments validation failed:", formData.acknowledgments);
      toast({
        title: "Incomplete Form",
        description: "Please check all required acknowledgments before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Validate team preferences
    if (formData.teamPreferences.length === 0) {
      console.log("Team preferences validation failed");
      toast({
        title: "Incomplete Form", 
        description: "Please select at least one team preference.",
        variant: "destructive",
      });
      return;
    }

    // Validate time availability
    if (formData.timeAvailability.length === 0) {
      console.log("Time availability validation failed");
      toast({
        title: "Incomplete Form",
        description: "Please select at least one time availability slot.",
        variant: "destructive",
      });
      return;
    }

    console.log("Final form data being submitted:", formData);
    submitMutation.mutate(formData);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-sm border border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-600 text-center">
              Thank You! 🎉
            </CardTitle>
            <CardDescription className="text-center">
              Your application has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                What happens next?
              </h3>
              <ul className="text-sm text-green-700 space-y-2 text-left max-w-md mx-auto">
                <li>• Your technical team application will be reviewed by our team</li>
                <li>• You'll receive a confirmation email shortly</li>
                <li>• Technical team assignments will be made on a first-come, first-serve basis</li>
                <li>• You'll be notified about your team assignment soon</li>
                <li>• Remember to join the GRiP Slack workspace</li>
              </ul>
            </div>
            <Button 
              onClick={() => {
                setIsSubmitted(false);
                window.location.reload();
              }}
              variant="outline"
              className="mt-4"
            >
              Submit Another Application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Join GRiP Technical Team
          </CardTitle>
          <CardDescription>
            Complete this form to join a technical division team for Spring 2025.
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
                        const team = technicalTeams.find(t => t.id === teamId);
                        return (
                          <div key={`${teamId}-${index}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center">
                              <span className="text-sm font-medium grip-orange text-white rounded-full w-6 h-6 flex items-center justify-center mr-3">
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
                            const newPreferences = [...teamPreferences, teamId];
                            setTeamPreferences(newPreferences);
                            form.setValue("teamPreferences", newPreferences);
                          }
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select a team to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {technicalTeams
                            .filter((team: Team) => !teamPreferences.includes(team.id))
                            .map((team: Team) => (
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
                              const newSkills = [...selectedSkills, skill];
                              setSelectedSkills(newSkills);
                              form.setValue("skills", newSkills);
                            } else {
                              const newSkills = selectedSkills.filter(s => s !== skill);
                              setSelectedSkills(newSkills);
                              form.setValue("skills", newSkills);
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
                            value={field.value || ""}
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

                <div className="overflow-x-auto" onMouseLeave={handleMouseUp}>
                  <div className="min-w-[900px]" onMouseUp={handleMouseUp}>
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
                            onMouseDown={() => handleMouseDown(day, time)}
                            onMouseEnter={() => handleMouseEnter(day, time)}
                            onMouseUp={handleMouseUp}
                            onClick={() => !isDragging && toggleTimeSlot(day, time)}
                            className={`p-2 rounded border transition-colors select-none ${
                              isTimeSlotSelected(day, time)
                                ? 'grip-blue border-grip-blue text-white'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                            style={{ userSelect: 'none' }}
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

              {/* Technical Teams Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-grip-blue pb-2">
                  Available Technical Teams
                </h3>
                <p className="text-sm text-slate-600">
                  These are the technical teams available for assignment. You'll rank your preferences above.
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {technicalTeams.map((team) => (
                    <div key={team.id} className="p-4 border border-grip-blue rounded-lg bg-blue-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-grip-blue text-lg">{team.name}</div>
                          {team.description && (
                            <div className="text-sm text-slate-700 mt-2">{team.description}</div>
                          )}
                          <div className="text-xs text-slate-600 mt-2">
                            <div><strong>Meeting Time:</strong> {team.meetingTime}</div>
                            <div><strong>Capacity:</strong> {team.currentSize}/{team.maxCapacity} members</div>
                            {team.requiredSkills && (
                              <div><strong>Skills:</strong> {team.requiredSkills}</div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            team.currentSize >= team.maxCapacity 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-grip-green text-white'
                          }`}>
                            {team.currentSize >= team.maxCapacity ? 'Full' : 'Available'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Teams Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-grip-green pb-2">
                  Additional Teams (Optional)
                </h3>
                <p className="text-sm text-slate-600">
                  Select additional teams you'd like to join alongside your technical team assignment. These teams have unlimited capacity and are open to all members.
                </p>

                <div className="space-y-3">
                  {constantTeams.map((team) => (
                    <label key={team.id} className="flex items-start space-x-3 p-3 border border-grip-green rounded-lg hover:bg-green-50 transition-colors">
                      <Checkbox
                        checked={selectedAdditionalTeams.includes(team.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const newTeams = [...selectedAdditionalTeams, team.id];
                            setSelectedAdditionalTeams(newTeams);
                            form.setValue("additionalTeams", newTeams);
                          } else {
                            const newTeams = selectedAdditionalTeams.filter(id => id !== team.id);
                            setSelectedAdditionalTeams(newTeams);
                            form.setValue("additionalTeams", newTeams);
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-grip-green">{team.name}</div>
                        {team.description && (
                          <div className="text-sm text-slate-600 mt-1">{team.description}</div>
                        )}
                        <div className="text-xs text-slate-500 mt-1">
                          <div><strong>Meeting Time:</strong> {team.meetingTime}</div>
                          <div><strong>Capacity:</strong> {team.currentSize}/{team.maxCapacity} members</div>
                        </div>
                        <div className="text-xs text-grip-green mt-2 font-medium">
                          ✓ Open to all members
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {selectedAdditionalTeams.length > 0 && (
                  <div className="p-3 bg-green-50 border border-grip-green rounded-lg">
                    <div className="text-sm text-grip-green font-medium">
                      <strong>Selected additional teams:</strong> {selectedAdditionalTeams.length}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      You can join these teams regardless of your technical team assignment.
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={submitMutation.isPending}
                  className="w-full grip-blue text-white hover:bg-grip-orange disabled:opacity-50 transition-colors"
                  onClick={() => {
                    console.log("Submit button clicked");
                    console.log("Current team preferences:", teamPreferences);
                    console.log("Current time availability:", timeAvailability);
                    console.log("Form errors:", form.formState.errors);
                  }}
                >
                  <NotebookPen className="w-4 h-4 mr-2" />
                  {submitMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
                {(teamPreferences.length === 0 || Object.values(timeAvailability).filter(Boolean).length === 0) && (
                  <p className="text-sm text-red-600 mt-2 text-center">
                    Please complete all required fields: team preferences and time availability (Debug: teams={teamPreferences.length}, time={Object.values(timeAvailability).filter(Boolean).length})
                  </p>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}