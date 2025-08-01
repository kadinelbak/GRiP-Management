import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { 
  ExternalLink, Calendar, MessageSquare, User, Eye, Clock, ArrowRight
} from "lucide-react";

interface NewsStory {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  type: 'story' | 'event' | 'link' | 'announcement';
  imageUrl?: string;
  linkUrl?: string;
  tags: string[];
  viewCount: number;
  publishDate?: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function NewsFeed() {
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<NewsStory | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news');
      if (response.ok) {
        const data = await response.json();
        setStories(data);
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = async (story: NewsStory) => {
    if (story.type === 'link' && story.linkUrl) {
      window.open(story.linkUrl, '_blank');
      return;
    }
    
    // For full stories, show expanded view
    if (story.content) {
      setSelectedStory(story);
      
      // Increment view count
      try {
        await fetch(`/api/news/${story.id}`);
      } catch (error) {
        console.error('Failed to track view:', error);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'link': return <ExternalLink className="w-4 h-4" />;
      case 'announcement': return <MessageSquare className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'event': return 'bg-blue-100 text-blue-800';
      case 'link': return 'bg-purple-100 text-purple-800';
      case 'announcement': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading news...</div>
      </div>
    );
  }

  if (selectedStory) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Button 
          variant="outline" 
          onClick={() => setSelectedStory(null)}
          className="mb-6"
        >
          ← Back to News Feed
        </Button>
        
        <article className="space-y-6">
          <header className="space-y-4">
            <div className="flex items-center gap-2">
              {getTypeIcon(selectedStory.type)}
              <Badge className={getTypeColor(selectedStory.type)}>
                {selectedStory.type}
              </Badge>
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900">
              {selectedStory.title}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {selectedStory.author.firstName} {selectedStory.author.lastName}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(selectedStory.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {selectedStory.viewCount} views
              </span>
            </div>
            
            {selectedStory.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {selectedStory.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {selectedStory.imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={selectedStory.imageUrl} 
                alt={selectedStory.title}
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}

          <div className="prose prose-slate max-w-none">
            {selectedStory.content ? (
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {selectedStory.content}
              </div>
            ) : (
              <div className="text-gray-700">
                {selectedStory.summary}
              </div>
            )}
          </div>

          {selectedStory.linkUrl && (
            <div className="pt-4 border-t">
              <Button asChild>
                <a href={selectedStory.linkUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Link
                </a>
              </Button>
            </div>
          )}
        </article>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">GRiP News & Updates</h1>
          <p className="text-gray-600">Stay up to date with the latest news, events, and announcements</p>
        </header>

        {stories.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No News Yet</h2>
            <p className="text-gray-500">Check back later for updates and announcements!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <Card 
                key={story.id} 
                className="group cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => handleStoryClick(story)}
              >
                {story.imageUrl && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img 
                      src={story.imageUrl} 
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}
                
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(story.type)}
                      <Badge className={getTypeColor(story.type)}>
                        {story.type}
                      </Badge>
                    </div>
                    {story.type === 'link' && (
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                    {story.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {story.summary && (
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {story.summary}
                    </p>
                  )}
                  
                  {story.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {story.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {story.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{story.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {story.author.firstName} {story.author.lastName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {story.viewCount}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500">
                    {new Date(story.createdAt).toLocaleDateString()}
                  </div>

                  {(story.content || story.type === 'link') && (
                    <div className="flex items-center text-sm text-blue-600 font-medium pt-2">
                      {story.type === 'link' ? 'Visit Link' : 'Read More'}
                      <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
