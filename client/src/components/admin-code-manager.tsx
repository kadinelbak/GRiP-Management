import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Copy, RefreshCw, Clock, Key, Users } from "lucide-react";
import { apiRequest } from "../lib/queryClient";

interface AdminCode {
  code: string;
  expiresAt: string;
  createdAt: string;
}

export default function AdminCodeManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current admin code
  const { data: adminCodeData, isLoading, error } = useQuery<AdminCode | { code: null; message: string }>({
    queryKey: ["/api/auth/admin-code/current"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  console.log("Admin code data:", adminCodeData);
  console.log("Admin code error:", error);

  // Generate new admin code
  const generateCodeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/admin-code/generate"),
    onSuccess: (response) => {
      console.log("Generate code success:", response);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/admin-code/current"] });
      toast({
        title: "New Admin Code Generated",
        description: "A new 24-hour signup code has been created.",
      });
    },
    onError: (error) => {
      console.error("Generate code error:", error);
      toast({
        title: "Error",
        description: "Failed to generate new admin code.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Admin code copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const isCodeActive = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) > new Date();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Admin Signup Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Admin Signup Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">
            Error loading admin codes: {error.message}
          </div>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/auth/admin-code/current"] })}
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasActiveCode = adminCodeData && 'code' in adminCodeData && adminCodeData.code;
  const codeData = hasActiveCode ? adminCodeData as AdminCode : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Admin Signup Codes
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage 24-hour signup codes that allow new admin account creation
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasActiveCode && codeData ? (
          <div className="space-y-4">
            {/* Current Active Code */}
            <div className="p-4 border rounded-lg bg-green-50 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-green-800">Current Active Code</h3>
                <Badge variant={isCodeActive(codeData.expiresAt) ? "default" : "destructive"}>
                  {isCodeActive(codeData.expiresAt) ? "Active" : "Expired"}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="px-3 py-2 bg-white border rounded font-mono text-lg tracking-wider">
                    {codeData.code}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(codeData.code)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-green-700">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTimeRemaining(codeData.expiresAt)}
                  </div>
                  <div>
                    Created: {new Date(codeData.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">How to use this code:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Share this code with the person who needs admin access</li>
                <li>They should visit <code className="px-1 bg-white rounded">/signup</code> page</li>
                <li>They enter this code along with their account details</li>
                <li>A new admin account will be created automatically</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Key className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Signup Code</h3>
            <p className="text-gray-600 mb-4">
              Generate a new 24-hour signup code to allow admin account creation
            </p>
          </div>
        )}

        {/* Generate New Code Button */}
        <div className="flex flex-col items-center gap-2">
          <Button
            onClick={() => generateCodeMutation.mutate()}
            disabled={generateCodeMutation.isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${generateCodeMutation.isPending ? 'animate-spin' : ''}`} />
            {hasActiveCode ? "Generate New Code" : "Generate Signup Code"}
          </Button>
          
          {generateCodeMutation.error && (
            <div className="text-red-600 text-sm text-center">
              Error: {generateCodeMutation.error.message}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center">
          Generating a new code will deactivate any existing codes
        </div>
      </CardContent>
    </Card>
  );
}
