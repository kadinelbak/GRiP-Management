import { useState } from "react";
import NewsFeed from "../components/news-feed";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Newspaper, Users, Clock, TrendingUp } from "lucide-react";
import { Badge } from "../components/ui/badge";

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Newspaper className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Latest News</h1>
              <p className="text-gray-600">Stay updated with the latest announcements and stories</p>
            </div>
          </div>
          
          {/* News Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="flex items-center p-4">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Published Stories</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-4">
                <div className="p-2 bg-orange-100 rounded-lg mr-3">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-4">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Contributors</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* News Categories */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">All</Badge>
            <Badge variant="secondary">Events</Badge>
            <Badge variant="secondary">Projects</Badge>
            <Badge variant="secondary">Achievements</Badge>
            <Badge variant="secondary">Announcements</Badge>
            <Badge variant="secondary">Community</Badge>
          </div>
        </div>

        {/* News Feed */}
        <NewsFeed />
      </div>
    </div>
  );
}
