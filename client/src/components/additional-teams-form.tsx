import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertAdditionalTeamSignupSchema } from "../../../shared/schema";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Check, Clock } from "lucide-react";
import type { z } from "zod";

type AdditionalTeamSignupData = z.infer<typeof insertAdditionalTeamSignupSchema>;

const additionalTeams = [
  {
    id: "marketing",
    name: "Marketing Team",
    description: "Help promote GRiP events, manage social media, and create marketing materials.",
    meetingTime: "Wednesdays 6:00 PM - 7:30 PM",
    location: "Online",
    capacity: 15,
  },
  {
    id: "outreach",
    name: "Outreach Team", 
    description: "Organize community events, school visits, and educational workshops.",
    meetingTime: "Fridays 4:00 PM - 5:30 PM",
    location: "Various Locations",
    capacity: 15,
  },
  {
    id: "art",
    name: "Art Team",
    description: "Design graphics, create visual content, and work on artistic elements of prosthetics.",
    meetingTime: "Tuesdays 7:00 PM - 8:30 PM",
    location: "Art Studio",
    capacity: 15,
  },
];

export default function AdditionalTeamsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const form = useForm<AdditionalTeamSignupData>({
    resolver: zodResolver(insertAdditionalTeamSignupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      ufid: "",
      selectedTeams: [],
    },
  });

  const submitMutation = useMutation({
    mutationFn: (data: AdditionalTeamSignupData) =>
      apiRequest("POST", "/api/additional-signups", data),
    onSuccess: () => {
      toast({
        title: "Successfully Signed Up!",
        description: "You have been signed up for the selected additional teams.",
      });
      form.reset();
      setSelectedTeams([]);
      queryClient.invalidateQueries({ queryKey: ["/api/additional-signups"] });
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to sign up for teams. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdditionalTeamSignupData) => {
    const formData = {
      ...data,
      selectedTeams,
    };
    submitMutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Join Additional Teams
          </CardTitle>
          <CardDescription>
            Sign up for additional non-technical teams to expand your involvement with GRiP.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your full name" />
                        </FormControl>
                        <FormMessage className="text-red-600" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="example@ufl.edu" />
                        </FormControl>
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
                          <Input {...field} placeholder="12345678" maxLength={8} />
                        </FormControl>
                        <FormMessage className="text-red-600" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Available Teams */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  Available Teams
                </h3>
                <p className="text-sm text-slate-600">
                  Select all teams you're interested in joining:
                </p>

                <div className="space-y-4">
                  {additionalTeams.map((team) => (
                    <div key={team.id} className="border border-slate-200 rounded-lg p-4">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <Checkbox
                          checked={selectedTeams.includes(team.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTeams([...selectedTeams, team.id]);
                            } else {
                              setSelectedTeams(selectedTeams.filter(t => t !== team.id));
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                        <div className="font-medium text-slate-900">{team.name}</div>
                        {team.description && (
                          <div className="text-sm text-slate-600 mt-1">{team.description}</div>
                        )}
                        <div className="text-xs text-slate-500 mt-1">
                          📅 {team.meetingTime} • 📍 {team.location}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          ✓ Capacity: {team.capacity} members
                        </div>
                      </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={submitMutation.isPending || selectedTeams.length === 0}
                  className="w-full grip-accent text-white hover:bg-orange-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {submitMutation.isPending ? "Signing Up..." : "Join Selected Teams"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}