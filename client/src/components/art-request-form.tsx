import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "../hooks/use-toast";
import { Palette, Upload, FileImage } from "lucide-react";

const artRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  artType: z.enum(["logo", "poster", "banner", "social_media", "website_graphics", "illustration", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  deadline: z.string().optional(),
  dimensions: z.string().optional(),
  colorPreferences: z.string().optional(),
  style: z.string().optional(),
  targetAudience: z.string().optional(),
  usage: z.string().optional(),
  references: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type ArtRequestFormData = z.infer<typeof artRequestSchema>;

export default function ArtRequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ArtRequestFormData>({
    resolver: zodResolver(artRequestSchema),
    defaultValues: {
      priority: "medium"
    }
  });

  const artType = watch("artType");

  const artRequestMutation = useMutation({
    mutationFn: async (data: ArtRequestFormData) => {
      const response = await fetch("/api/art-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit art request");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Art Request Submitted!",
        description: "Your art request has been submitted and will be reviewed by the art team.",
      });
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ArtRequestFormData) => {
    setIsSubmitting(true);
    artRequestMutation.mutate(data);
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Palette className="w-6 h-6 text-purple-600" />
            <CardTitle className="text-2xl font-bold">Art Request Form</CardTitle>
          </div>
          <p className="text-gray-600">
            Submit a request for custom artwork, graphics, or design work
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Enter project title"
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="artType">Art Type</Label>
                  <Select onValueChange={(value) => setValue("artType", value as any)}>
                    <SelectTrigger className={errors.artType ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select art type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="logo">Logo Design</SelectItem>
                      <SelectItem value="poster">Poster</SelectItem>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="social_media">Social Media Graphics</SelectItem>
                      <SelectItem value="website_graphics">Website Graphics</SelectItem>
                      <SelectItem value="illustration">Illustration</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.artType && (
                    <p className="text-sm text-red-500 mt-1">{errors.artType.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe what you need in detail..."
                  rows={4}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select onValueChange={(value) => setValue("priority", value as any)} defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    {...register("deadline")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dimensions">Dimensions/Size</Label>
                  <Input
                    id="dimensions"
                    {...register("dimensions")}
                    placeholder="e.g., 1920x1080px, 8.5x11 inches"
                  />
                </div>

                <div>
                  <Label htmlFor="usage">Intended Usage</Label>
                  <Input
                    id="usage"
                    {...register("usage")}
                    placeholder="e.g., website, print, social media"
                  />
                </div>
              </div>
            </div>

            {/* Design Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Design Preferences</h3>
              
              <div>
                <Label htmlFor="style">Style Preferences</Label>
                <Input
                  id="style"
                  {...register("style")}
                  placeholder="e.g., modern, minimalist, playful, professional"
                />
              </div>

              <div>
                <Label htmlFor="colorPreferences">Color Preferences</Label>
                <Input
                  id="colorPreferences"
                  {...register("colorPreferences")}
                  placeholder="e.g., blue and white, vibrant colors, monochrome"
                />
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  {...register("targetAudience")}
                  placeholder="Who is this design for?"
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
              
              <div>
                <Label htmlFor="references">Reference Materials/Inspiration</Label>
                <Textarea
                  id="references"
                  {...register("references")}
                  placeholder="Include links to inspiration, similar designs, or specific requirements..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  {...register("additionalNotes")}
                  placeholder="Any other details or special requirements..."
                  rows={3}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => reset()}
                disabled={isSubmitting}
              >
                Clear Form
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || artRequestMutation.isPending}
                className="flex items-center gap-2"
              >
                {isSubmitting || artRequestMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <FileImage className="w-4 h-4" />
                    Submit Art Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
