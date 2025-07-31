import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BarChart3, Users, Inbox, CheckCircle, Clock } from "lucide-react";

interface AdminStats {
  totalApplications: number;
  assignedApplications: number;
  waitlistedApplications: number;
  totalTeams: number;
  filledTeams: number;
  totalProjectRequests: number;
  totalAdditionalSignups: number;
}

interface RecentActivity {
  type: string;
  message: string;
  description: string;
  timestamp: string;
  color: string;
}

export default function OverviewSection() {
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: recentActivities = [] } = useQuery<RecentActivity[]>({
    queryKey: ["/api/admin/recent-activity"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const statsCards = [
    {
      title: "Total Applications",
      value: stats?.totalApplications || 0,
      icon: Inbox,
      description: "All team applications received",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Assigned Members",
      value: stats?.assignedApplications || 0,
      icon: CheckCircle,
      description: "Members assigned to teams",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Waitlisted",
      value: stats?.waitlistedApplications || 0,
      icon: Clock,
      description: "Applications on waitlist",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Active Teams",
      value: stats?.totalTeams || 0,
      icon: Users,
      description: "Total teams created",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Filled Teams",
      value: stats?.filledTeams || 0,
      icon: BarChart3,
      description: "Teams at full capacity",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    {
      title: "Project Requests",
      value: stats?.totalProjectRequests || 0,
      icon: Inbox,
      description: "External project requests",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-medium">Manage Teams</h3>
                <p className="text-sm text-slate-600">Create and edit teams</p>
              </div>
            </div>
            <div className="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="text-center">
                <Inbox className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-medium">Review Applications</h3>
                <p className="text-sm text-slate-600">Process new applications</p>
              </div>
            </div>
            <div className="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-medium">Assign Members</h3>
                <p className="text-sm text-slate-600">Auto-assign to teams</p>
              </div>
            </div>
            <div className="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <h3 className="font-medium">Export Data</h3>
                <p className="text-sm text-slate-600">Download reports</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No recent activity to display</p>
                <p className="text-sm text-slate-400 mt-2">Activity will appear here as users interact with the system</p>
              </div>
            ) : (
              recentActivities.map((activity, index) => {
                const getColorClasses = (color: string) => {
                  switch (color) {
                    case 'green': return 'bg-green-500';
                    case 'blue': return 'bg-blue-500';
                    case 'purple': return 'bg-purple-500';
                    case 'orange': return 'bg-orange-500';
                    case 'yellow': return 'bg-yellow-500';
                    default: return 'bg-slate-500';
                  }
                };

                const formatTimeAgo = (timestamp: string) => {
                  const now = new Date();
                  const activityTime = new Date(timestamp);
                  const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
                  
                  if (diffInMinutes < 1) return 'Just now';
                  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
                  
                  const diffInHours = Math.floor(diffInMinutes / 60);
                  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
                  
                  const diffInDays = Math.floor(diffInHours / 24);
                  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
                };

                return (
                  <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${getColorClasses(activity.color)}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-slate-600">{activity.description}</p>
                    </div>
                    <span className="text-xs text-slate-500">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
