import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertProjectRequestSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotebookPen } from "lucide-react";
import type { z } from "zod";

type ProjectRequestData = z.infer<typeof insertProjectRequestSchema>;

const projectTypes = [
  { value: "prosthetic-hand", label: "Prosthetic Hand" },
  { value: "prosthetic-arm", label: "Prosthetic Arm" },
  { value: "prosthetic-leg", label: "Prosthetic Leg" },
  { value: "assistive-device", label: "General Assistive Device" },
  { value: "adaptive-gaming", label: "Adaptive Gaming Controller" },
  { value: "other", label: "Other" },
];

const priorityLevels = [
  { value: "urgent", label: "Urgent - Immediate need" },
  { value: "high", label: "High - Needed within 2-3 months" },
  { value: "medium", label: "Medium - Needed within 6 months" },
  { value: "low", label: "Low - No immediate timeline" },
];

const hearAboutOptions = [
  { value: "social-media", label: "Social Media" },
  { value: "website", label: "GRiP Website" },
  { value: "referral", label: "Friend/Family Referral" },
  { value: "healthcare", label: "Healthcare Provider" },
  { value: "event", label: "Community Event" },
  { value: "other", label: "Other" },
];

export default function ProjectRequestForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProjectRequestData>({
    resolver: zodResolver(insertProjectRequestSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      projectType: "",
      projectTitle: "",
      description: "",
      priority: "",
      budgetConsiderations: "",
      howHeardAbout: "",
      consentGiven: false,
    },
  });

  const submitMutation = useMutation({
    mutationFn: (data: ProjectRequestData) =>
      apiRequest("POST", "/api/project-requests", data),
    onSuccess: () => {
      toast({
        title: "Project Request Submitted!",
        description: "Your project request has been submitted successfully. Our team will review it and contact you soon.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/project-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit project request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectRequestData) => {
    submitMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Submit Project Request
          </CardTitle>
          <CardDescription>
            Do you need an assistive device or prosthetic? Submit your project request and our teams will review it.
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
                        <FormMessage />
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
                          <Input {...field} type="email" placeholder="your.email@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="(555) 123-4567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your address (optional)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Project Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  Project Details
                </h3>
                
                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projectTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name="projectTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Brief title for your project" />
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
                      <FormLabel>Detailed Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={6} 
                          placeholder="Please provide a detailed description of what you need, including:&#10;- What tasks do you want to accomplish?&#10;- Any specific requirements or constraints?&#10;- Current limitations you're facing?&#10;- Any previous solutions you've tried?"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Level *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorityLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
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
                  name="budgetConsiderations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Considerations</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={3} 
                          placeholder="Any budget constraints or funding information we should know about?"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  Additional Information
                </h3>
                
                <FormField
                  control={form.control}
                  name="howHeardAbout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How did you hear about GRiP?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hearAboutOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                  name="consentGiven"
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
                          I consent to being contacted by GRiP team members regarding this project request and understand that project completion is not guaranteed.
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={submitMutation.isPending}
                  className="w-full grip-success text-white hover:bg-emerald-700"
                >
                  <NotebookPen className="w-4 h-4 mr-2" />
                  {submitMutation.isPending ? "Submitting..." : "Submit Project Request"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
