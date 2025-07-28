
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertEventAttendanceSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload } from "lucide-react";
import type { z } from "zod";
import type { Event } from "@shared/schema";

type AttendanceFormData = z.infer<typeof insertEventAttendanceSchema>;

export default function EventAttendanceForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const activeEvents = events.filter(event => event.isActive);

  const form = useForm<AttendanceFormData>({
    resolver: zodResolver(insertEventAttendanceSchema),
    defaultValues: {
      eventId: "",
      fullName: "",
      ufid: "",
      photo: "",
      socialMediaPermission: false,
    },
  });

  const submitAttendanceMutation = useMutation({
    mutationFn: (data: AttendanceFormData) =>
      apiRequest("POST", "/api/event-attendance", data),
    onSuccess: () => {
      toast({
        title: "Attendance Submitted",
        description: "Your event attendance has been submitted for review.",
      });
      form.reset();
      setPhotoPreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/event-attendance"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit attendance.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select a photo smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setPhotoPreview(base64String);
        form.setValue("photo", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: AttendanceFormData) => {
    if (!data.photo) {
      toast({
        title: "Photo Required",
        description: "Please upload a photo to verify your attendance.",
        variant: "destructive",
      });
      return;
    }
    submitAttendanceMutation.mutate(data);
  };

  const selectedEvent = activeEvents.find(event => event.id === form.watch("eventId"));

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Submit Event Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="eventId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Event *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an event" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeEvents.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title} - {new Date(event.eventDate).toLocaleDateString()} ({event.points} points)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedEvent && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">{selectedEvent.title}</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {new Date(selectedEvent.eventDate).toLocaleString()} • {selectedEvent.location}
                  </p>
                  {selectedEvent.description && (
                    <p className="text-sm text-blue-600 mt-2">{selectedEvent.description}</p>
                  )}
                  <p className="text-sm font-medium text-blue-900 mt-2">
                    Points: {selectedEvent.points}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
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
                        <Input 
                          placeholder="12345678" 
                          {...field}
                          maxLength={8}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Photo *</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('photo-upload')?.click()}
                            className="flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Upload Photo
                          </Button>
                          <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                          <span className="text-sm text-gray-500">
                            Max 5MB • JPG, PNG, GIF
                          </span>
                        </div>
                        
                        {photoPreview && (
                          <div className="mt-4">
                            <img
                              src={photoPreview}
                              alt="Preview"
                              className="max-w-xs max-h-48 object-cover rounded-lg border"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="socialMediaPermission"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Social Media Permission
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        I give permission for this photo to be used on GRiP's social media accounts
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={submitAttendanceMutation.isPending || !form.watch("eventId")}
              >
                {submitAttendanceMutation.isPending ? "Submitting..." : "Submit Attendance"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
