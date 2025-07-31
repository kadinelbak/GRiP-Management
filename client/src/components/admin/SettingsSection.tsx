import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "../../hooks/use-toast";
import { Save, Plus, X, CheckCircle } from "lucide-react";

export default function SettingsSection() {
  const { toast } = useToast();
  const [newDomain, setNewDomain] = useState("");

  const handleSaveSettings = async () => {
    try {
      // Placeholder for settings save logic
      toast({
        title: "Settings Saved",
        description: "Your configuration has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    }
  };

  const handleAddDomain = () => {
    if (newDomain.trim()) {
      // Placeholder for add domain logic
      toast({
        title: "Domain Added",
        description: `${newDomain} has been added to allowed domains.`,
      });
      setNewDomain("");
    }
  };

  const handleRemoveDomain = (domain: string) => {
    // Placeholder for remove domain logic
    toast({
      title: "Domain Removed",
      description: `${domain} has been removed from allowed domains.`,
    });
  };

  const handleDeadlineChange = async (date: string) => {
    try {
      // Placeholder for deadline update logic
      toast({
        title: "Deadline Updated",
        description: "Application deadline has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update deadline.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Domain Configuration</CardTitle>
            <CardDescription>
              Manage allowed email domains for applications (@ufl.edu examples)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">@ufl.edu</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveDomain("@ufl.edu")}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">@sfcollege.edu</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveDomain("@sfcollege.edu")}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">@gnv.ifas.ufl.edu</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveDomain("@gnv.ifas.ufl.edu")}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">@shands.ufl.edu</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveDomain("@shands.ufl.edu")}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex gap-2">
                <Input 
                  placeholder="Add new domain (e.g., @ufl.edu)" 
                  className="flex-1"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                />
                <Button onClick={handleAddDomain} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Form Settings</CardTitle>
            <CardDescription>
              Configure application deadlines and form behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Application Deadline</label>
                <Input
                  type="date"
                  defaultValue="2024-02-15"
                  className="mt-1"
                  onChange={(e) => handleDeadlineChange(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Applications will be closed after this date
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Maximum Team Preferences</label>
                <Input
                  type="number"
                  defaultValue="3"
                  min="1"
                  max="9"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum number of teams students can rank
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Require UF Email</div>
                  <div className="text-xs text-gray-500">Only allow UF domain emails</div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Enable File Uploads</div>
                  <div className="text-xs text-gray-500">Allow resume and portfolio uploads</div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={handleSaveSettings} variant="outline" size="sm" className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Form Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Overview of system health and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Database</span>
              </div>
              <p className="text-xs text-gray-500">Connected and operational</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Applications</span>
              </div>
              <p className="text-xs text-gray-500">Form submissions active</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">Email Notifications</span>
              </div>
              <p className="text-xs text-gray-500">Not configured</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Administrative Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Administrative Actions</CardTitle>
          <CardDescription>
            Dangerous actions that affect the entire system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <h4 className="text-sm font-medium text-red-800 mb-2">Danger Zone</h4>
              <p className="text-xs text-red-600 mb-3">
                These actions are irreversible and will affect all users.
              </p>
              <div className="space-y-2">
                <Button variant="destructive" size="sm" className="w-full">
                  Reset All Applications
                </Button>
                <Button variant="destructive" size="sm" className="w-full">
                  Clear All Team Assignments
                </Button>
                <Button variant="destructive" size="sm" className="w-full">
                  Reset Database
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
