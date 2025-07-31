
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertTeamSchema } from "../../../shared/schema";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus } from "lucide-react";
import type { z } from "zod";

type TeamFormData = z.infer<typeof insertTeamSchema>;

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timeSlots = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", 
  "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"
];

export default function TeamCreationForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [meetingDay, setMeetingDay] = useState("");
  const [meetingStartTime, setMeetingStartTime] = useState("");
  const [meetingEndTime, setMeetingEndTime] = useState("");

  const form = useForm<TeamFormData>({
    resolver: zodResolver(insertTeamSchema),
    defaultValues: {
      name: "",
      type: "technical",
      maxCapacity: 15,
      meetingTime: "",
      location: "",
      requiredSkills: "",
      description: "",
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: (data: TeamFormData) =>
      apiRequest("POST", "/api/teams", data),
    onSuccess: () => {
      toast({
        title: "Team Created!",
        description: "New team has been created successfully.",
      });
      form.reset();
      setMeetingDay("");
      setMeetingStartTime("");
      setMeetingEndTime("");
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create team. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TeamFormData) => {
    // Combine meeting day, start time, end time, and location into meetingTime
    let meetingTimeString = "";
    if (meetingDay && meetingStartTime && meetingEndTime) {
      meetingTimeString = `${meetingDay} ${meetingStartTime} - ${meetingEndTime}`;
      if (data.location) {
        meetingTimeString += `, ${data.location}`;
      }
    }

    const finalData = {
      ...data,
      meetingTime: meetingTimeString,
    };

    createTeamMutation.mutate(finalData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Plus className="w-6 h-6" />
            Create New Team
          </CardTitle>
          <CardDescription>
            Create a new team for GRiP members to join. Fill in all required information including meeting details.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Robotics Team" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="constant">Constant</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="maxCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Capacity *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="1" 
                        placeholder="15"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Meeting Time Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Meeting Schedule</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FormLabel>Meeting Day *</FormLabel>
                    <Select value={meetingDay} onValueChange={setMeetingDay}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <FormLabel>Start Time *</FormLabel>
                    <Select value={meetingStartTime} onValueChange={setMeetingStartTime}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <FormLabel>End Time *</FormLabel>
                    <Select value={meetingEndTime} onValueChange={setMeetingEndTime}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="End time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Location *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""} 
                          placeholder="e.g., Reitz Union Room 345" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                  <strong>Preview:</strong> {meetingDay && meetingStartTime && meetingEndTime 
                    ? `${meetingDay} ${meetingStartTime} - ${meetingEndTime}${form.watch("location") ? `, ${form.watch("location")}` : ""}`
                    : "Select meeting day, times, and location to see preview"
                  }
                </div>
              </div>

              <FormField
                control={form.control}
                name="requiredSkills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Skills</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="e.g., Programming, CAD Design" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""}
                        rows={4}
                        placeholder="Describe what this team does and what members can expect..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={createTeamMutation.isPending || !meetingDay || !meetingStartTime || !meetingEndTime}
              >
                {createTeamMutation.isPending ? "Creating..." : "Create Team"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
