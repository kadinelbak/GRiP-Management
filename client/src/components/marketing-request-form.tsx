
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { insertMarketingRequestSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, CheckCircle } from "lucide-react";

import type { z } from "zod";

type MarketingRequestFormData = z.infer<typeof insertMarketingRequestSchema>;

export default function MarketingRequestForm() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<MarketingRequestFormData>({
    resolver: zodResolver(insertMarketingRequestSchema),
    defaultValues: {
      fullName: "",
      email: "",
      ufid: "",
      associatedEventName: "",
      detailedDescription: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: (data: MarketingRequestFormData) =>
      apiRequest("POST", "/api/marketing-requests", data),
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Marketing Request Submitted",
        description: "Your marketing request has been submitted successfully. You will be contacted soon.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit marketing request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MarketingRequestFormData) => {
    submitMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="text-center">
          <CardContent className="pt-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Marketing Request Submitted!</h2>
            <p className="text-slate-600 mb-6">
              Thank you for submitting your marketing request. Our marketing team will review your submission and get back to you soon.
            </p>
            <Button
              onClick={() => {
                setIsSubmitted(false);
                form.reset();
              }}
              variant="outline"
            >
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Marketing Request Form</CardTitle>
          <CardDescription>
            Submit a marketing request for your event or initiative. Our marketing team will review and respond to your request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="ufid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UFID *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12345678" maxLength={8} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="associatedEventName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Associated Event Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter event name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="detailedDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description of the Request *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Please provide a detailed description of your marketing request including what type of marketing materials you need, target audience, timeline, and any specific requirements..."
                        rows={6}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What to Include in Your Request</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Type of marketing materials needed (flyers, social media posts, banners, etc.)</li>
                  <li>• Target audience and expected reach</li>
                  <li>• Timeline and important deadlines</li>
                  <li>• Specific design requirements or preferences</li>
                  <li>• Budget considerations (if applicable)</li>
                  <li>• Any existing brand guidelines or materials to reference</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Marketing Request
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
