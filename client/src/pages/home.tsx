import { useState } from "react";
import NewsFeed from "../components/news-feed";
import { useAuth } from "../hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  Users, 
  Wrench, 
  Settings, 
  Newspaper,
  ArrowRight,
  Target,
  Heart,
  Lightbulb
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  // Check if user has admin/special role privileges
  const isAdmin = user?.role === 'coordinator' || user?.role === 'manager' || user?.role === 'president' || user?.role === 'admin';

  const quickActions = [
    {
      title: "Latest News",
      description: "Stay updated with announcements and stories",
      icon: Newspaper,
      href: "/news",
      color: "bg-blue-500",
      available: true
    },
    {
      title: "Member Services",
      description: "Join teams, submit projects, and participate",
      icon: Users,
      href: "/member-services", 
      color: "bg-green-500",
      available: isAuthenticated
    },
    {
      title: "Tools",
      description: "Access administrative tools and forms",
      icon: Wrench,
      href: "/tools",
      color: "bg-purple-500",
      available: isAuthenticated && isAdmin
    },
    {
      title: "Admin Dashboard",
      description: "Manage the organization and review submissions",
      icon: Settings,
      href: "/admin",
      color: "bg-orange-500",
      available: isAuthenticated && isAdmin
    }
  ];

  const availableActions = quickActions.filter(action => action.available);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Generational Relief in Prosthetics
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Empowering communities through innovative prosthetic solutions
            </p>
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                    Join Our Mission
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                    Member Login
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mission Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We're dedicated to creating innovative prosthetic solutions that improve lives and build stronger communities.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Developing cutting-edge prosthetic technology to meet diverse needs and improve accessibility.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Building connections between individuals, families, and communities affected by limb differences.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Creating lasting change through research, development, and direct community support.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Access for All Users */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Access</h2>
            <p className="text-lg text-gray-600">
              Explore our platform and discover what we have to offer
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card key={action.href} className={`hover:shadow-lg transition-shadow ${action.available ? 'cursor-pointer' : 'opacity-50'}`}>
                  <CardHeader className="text-center">
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {action.available ? (
                      <Link href={action.href}>
                        <Button className="w-full">
                          Access <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    ) : (
                      <Button className="w-full" disabled>
                        {isAuthenticated ? 'Requires Special Access' : 'Login Required'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Latest News Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Latest News</h2>
            <Link href="/news">
              <Button variant="outline">
                View All News <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <NewsFeed />
        </div>
      </div>
    </div>
  );
}
