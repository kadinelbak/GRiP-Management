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
import { NotebookPen, Info } from "lucide-react";
import type { z } from "zod";
import type { Team } from "@shared/schema";

type ApplicationFormData = z.infer<typeof insertApplicationSchema>;

const skillOptions = [
  "3D Modeling",
  "Programming", 
  "Electronics",
  "Research",
  "CAD Design",
  "Game Development",
];

const dayOptions = [
  "Monday",
  "Tuesday", 
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const timeOptions = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM",
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
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(insertApplicationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      ufid: "",
      preferredTeamId: "",
      skills: [],
      additionalSkills: "",
      availableDays: [],
      preferredStartTime: "",
      preferredEndTime: "",
      acknowledgments: new Array(7).fill(false),
    },
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams/type/technical"],
  });

  const submitMutation = useMutation({
    mutationFn: (data: ApplicationFormData) => 
      apiRequest("POST", "/api/applications", data),
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "Your application has been submitted successfully. You will receive a confirmation email shortly.",
      });
      form.reset();
      setSelectedSkills([]);
      setSelectedDays([]);
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

  const onSubmit = (data: ApplicationFormData) => {
    const formData = {
      ...data,
      skills: selectedSkills,
      availableDays: selectedDays,
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
                
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter your full name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      <FormMessage />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Team Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  Team Preferences
                </h3>
                
                <FormField
                  control={form.control}
                  name="preferredTeamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Team *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your preferred team" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                        <FormMessage />
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
                
                <div>
                  <FormLabel>Available Days (Select all that apply)</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {dayOptions.map((day) => (
                      <label key={day} className="flex items-center">
                        <Checkbox
                          checked={selectedDays.includes(day)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDays([...selectedDays, day]);
                            } else {
                              setSelectedDays(selectedDays.filter(d => d !== day));
                            }
                          }}
                        />
                        <span className="ml-2 text-sm">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="preferredStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Start Time</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeOptions.slice(0, -4).map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredEndTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred End Time</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeOptions.slice(2).map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                            <FormMessage />
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
