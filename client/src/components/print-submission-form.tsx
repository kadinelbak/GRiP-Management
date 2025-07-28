import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { insertPrintSubmissionSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText } from "lucide-react";
import type { z } from "zod";

type PrintSubmissionData = z.infer<typeof insertPrintSubmissionSchema>;

const requestTypes = [
  { value: "adaptive-gaming", label: "Adaptive Gaming" },
  { value: "prosthetic", label: "Prosthetic" },
  { value: "assistive-device", label: "Assistive Device" },
  { value: "test", label: "Test" },
  { value: "prototype", label: "Prototype" },
  { value: "other", label: "Other" }
];

const colorOptions = [
  { value: "white", label: "White" },
  { value: "black", label: "Black" },
  { value: "red", label: "Red" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "yellow", label: "Yellow" },
  { value: "orange", label: "Orange" },
  { value: "purple", label: "Purple" },
  { value: "gray", label: "Gray" },
  { value: "transparent", label: "Transparent/Clear" },
  { value: "other", label: "Other" }
];

export default function PrintSubmissionForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Fetch technical teams for dropdown
  const { data: technicalTeams = [] } = useQuery({
    queryKey: ["/api/teams/type/technical"],
    queryFn: () => apiRequest("GET", "/api/teams/type/technical"),
  });

  const form = useForm<PrintSubmissionData>({
    resolver: zodResolver(insertPrintSubmissionSchema),
    defaultValues: {
      submitterName: "",
      emailAddress: "",
      requestType: "",
      teamName: "",
      color: "",
      generalPrintDescription: "",
      fileSpecifications: "",
      comments: "",
      deadline: undefined,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: PrintSubmissionData) => {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'deadline' && value) {
            formData.append(key, new Date(value).toISOString());
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Add files
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      // Use fetch instead of apiRequest for file upload
      const response = await fetch('/api/print-submissions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit print request');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Print Submission Successful!",
        description: "Your print request has been submitted and will be reviewed by our team.",
      });
      form.reset();
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ["/api/print-submissions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit print request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PrintSubmissionData) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    submitMutation.mutate(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Filter for zip files and STL files
    const validFiles = files.filter(file => {
      const isZip = file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip');
      const isStl = file.name.toLowerCase().endsWith('.stl');
      return isZip || isStl;
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid File Type",
        description: "Please only upload ZIP or STL files.",
        variant: "destructive",
      });
    }

    setSelectedFiles(validFiles);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Print Submission Request
          </CardTitle>
          <CardDescription>
            Submit your 3D printing request with files and specifications
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  Submitter Information
                </h3>

                <FormField
                  control={form.control}
                  name="submitterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submitter Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter your full name" />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="your.email@example.com" />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select request type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {requestTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-600" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="teamName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {technicalTeams.map((team: any) => (
                              <SelectItem key={team.id} value={team.name}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-600" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colorOptions.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              {color.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Deadline *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date)}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  File Upload
                </h3>

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-lg font-medium text-slate-700">
                      Upload Files
                    </span>
                    <p className="text-sm text-slate-500 mt-2">
                      ZIP files or STL files (drag and drop or click to browse)
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept=".zip,.stl"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Selected Files:</p>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                        <span className="text-sm text-slate-600">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Print Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  Print Details
                </h3>

                <FormField
                  control={form.control}
                  name="generalPrintDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>General Print Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          value={field.value || ""}
                          rows={4} 
                          placeholder="Describe what you need printed and its purpose"
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fileSpecifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Specifications</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          value={field.value || ""}
                          rows={3} 
                          placeholder="Any specific requirements for material, size, quality, etc."
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Comments</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          value={field.value || ""}
                          rows={3} 
                          placeholder="Any additional information or special requests"
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
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {submitMutation.isPending ? "Submitting..." : "Submit Print Request"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}