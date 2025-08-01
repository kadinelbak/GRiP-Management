import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "../hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Newspaper, Save, Eye } from "lucide-react";

interface NewsStoryData {
  title: string;
  content: string;
  summary: string;
  category: string;
  priority: 'low' | 'normal' | 'high';
  tags: string[];
}

export default function NewsStoryForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<NewsStoryData>({
    title: '',
    content: '',
    summary: '',
    category: 'general',
    priority: 'normal',
    tags: []
  });
  
  const [tagInput, setTagInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  const createNewsStory = useMutation({
    mutationFn: async (data: NewsStoryData) => {
      const response = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "News story submitted for review. It will need 2 approvals before being published.",
      });
      queryClient.invalidateQueries({ queryKey: ['news'] });
      // Reset form
      setFormData({
        title: '',
        content: '',
        summary: '',
        category: 'general',
        priority: 'normal',
        tags: []
      });
      setTagInput('');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.summary.trim()) {
      toast({
        title: "Validation Error",
        description: "Title, content, and summary are required fields.",
        variant: "destructive",
      });
      return;
    }

    createNewsStory.mutate(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const categories = [
    'general',
    'events',
    'projects',
    'achievements',
    'announcements',
    'community',
    'technical',
    'fundraising'
  ];

  if (isPreview) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            <CardTitle>News Story Preview</CardTitle>
          </div>
          <Button onClick={() => setIsPreview(false)} variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="secondary">{formData.category}</Badge>
              <Badge variant={formData.priority === 'high' ? 'destructive' : formData.priority === 'normal' ? 'default' : 'secondary'}>
                {formData.priority} priority
              </Badge>
            </div>
            <h1 className="text-3xl font-bold mb-4">{formData.title || 'Untitled Story'}</h1>
            <p className="text-lg text-gray-600 mb-6 italic">{formData.summary || 'No summary provided'}</p>
            <div className="whitespace-pre-wrap">{formData.content || 'No content provided'}</div>
            {formData.tags.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="outline">#{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 pt-6 border-t">
            <Button onClick={handleSubmit} disabled={createNewsStory.isPending} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {createNewsStory.isPending ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          <CardTitle>Create News Story</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter story title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Brief summary of the story (will be shown in news feed)"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Full story content"
              rows={10}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: 'low' | 'normal' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="Add tags"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
            </div>
          </div>

          {formData.tags.length > 0 && (
            <div className="space-y-2">
              <Label>Current Tags</Label>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    #{tag} ×
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="button" onClick={() => setIsPreview(true)} variant="outline" className="flex-1">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button type="submit" disabled={createNewsStory.isPending} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {createNewsStory.isPending ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Review Process</h3>
          <p className="text-sm text-blue-700">
            Your news story will need approval from 2 administrators before it can be published. 
            You'll receive notifications about the approval status via the admin dashboard.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
