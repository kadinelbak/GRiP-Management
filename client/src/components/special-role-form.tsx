
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertRoleApplicationSchema } from "../../../shared/schema";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Star, CheckCircle, Info } from "lucide-react";
import type { z } from "zod";
import type { SpecialRole } from "../../../shared/schema";

type RoleApplicationFormData = z.infer<typeof insertRoleApplicationSchema>;

export default function SpecialRoleForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<RoleApplicationFormData>({
    resolver: zodResolver(insertRoleApplicationSchema),
    defaultValues: {
      roleId: "",
      applicantName: "",
      applicantEmail: "",
      ufid: "",
      currentTeam: "",
      experience: "",
      motivation: "",
      availability: "",
      additionalInfo: "",
    },
  });

  const { data: specialRoles = [] } = useQuery<SpecialRole[]>({
    queryKey: ["/api/special-roles"],
  });

  const submitMutation = useMutation({
    mutationFn: (data: RoleApplicationFormData) => {
      return apiRequest("POST", "/api/role-applications", data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "Your special role application has been submitted successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/role-applications"] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RoleApplicationFormData) => {
    submitMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-sm border border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-600 text-center">
              Application Submitted! 🌟
            </CardTitle>
            <CardDescription className="text-center">
              Your special role application has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                What happens next?
              </h3>
              <ul className="text-sm text-green-700 space-y-2 text-left max-w-md mx-auto">
                <li>• Your application will be reviewed by the admin team</li>
                <li>• You'll receive a notification about the decision</li>
                <li>• If approved, the role will be assigned to your member profile</li>
                <li>• You can track your application status through this form</li>
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

  const selectedRole = specialRoles.find(role => role.id === form.watch("roleId"));

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Apply for Special Role
          </CardTitle>
          <CardDescription>
            Apply for a leadership or specialized position within GRiP.
          </CardDescription>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Only current GRiP members can apply for special roles. Your UFID will be used to match your existing member profile.
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
                  name="applicantName"
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
                  name="applicantEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
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
                        <Input {...field} placeholder="12345678" />
                      </FormControl>
                      <p className="text-xs text-slate-500">Used to match your existing member profile</p>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentTeam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Team</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your current team (optional)" />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  Role Selection
                </h3>

                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Role *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role to apply for" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {specialRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                {role.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                {selectedRole && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-blue-900 mb-2">{selectedRole.name}</h4>
                      {selectedRole.description && (
                        <p className="text-sm text-blue-800 mb-3">{selectedRole.description}</p>
                      )}
                      {selectedRole.responsibilities && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-blue-900">Responsibilities:</span>
                          <p className="text-sm text-blue-700">{selectedRole.responsibilities}</p>
                        </div>
                      )}
                      {selectedRole.requirements && (
                        <div>
                          <span className="text-sm font-medium text-blue-900">Requirements:</span>
                          <p className="text-sm text-blue-700">{selectedRole.requirements}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Application Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  Application Details
                </h3>

                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relevant Experience *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={4} 
                          placeholder="Describe your relevant experience, skills, and background that make you suitable for this role..."
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motivation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivation *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={4} 
                          placeholder="Why do you want this role? What would you contribute to GRiP in this position..."
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={3} 
                          placeholder="Describe your availability for this role (time commitment, schedule, etc.)..."
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={3} 
                          placeholder="Any additional information you'd like to share (optional)..."
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={submitMutation.isPending}
                  className="w-full grip-blue text-white hover:bg-grip-orange disabled:opacity-50 transition-colors"
                >
                  <Star className="w-4 h-4 mr-2" />
                  {submitMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Available Roles Overview */}
      <Card className="mt-6 shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            Available Special Roles
          </CardTitle>
          <CardDescription>
            Overview of all special roles you can apply for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {specialRoles.map((role) => (
              <div key={role.id} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <h4 className="font-medium text-slate-900">{role.name}</h4>
                  <Badge variant="outline" className="ml-auto">Available</Badge>
                </div>
                {role.description && (
                  <p className="text-sm text-slate-600 mb-2">{role.description}</p>
                )}
                {role.requirements && (
                  <p className="text-xs text-slate-500">
                    <span className="font-medium">Requirements:</span> {role.requirements}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
