import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useToast } from "../hooks/use-toast";
import { Send, Newspaper } from "lucide-react";

interface NewsSubmissionFormProps {
  onSubmissionSuccess?: () => void;
}

export default function NewsSubmissionForm({ onSubmissionSuccess }: NewsSubmissionFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    type: 'story' as 'story' | 'event' | 'link' | 'announcement',
    imageUrl: '',
    linkUrl: '',
    tags: '',
    submitterName: '',
    submitterEmail: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const submissionData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await fetch('/api/news/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        toast({
          title: "News Story Submitted!",
          description: "Your story has been submitted for review by administrators.",
        });
        resetForm();
        onSubmissionSuccess?.();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit story');
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit news story",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      type: 'story',
      imageUrl: '',
      linkUrl: '',
      tags: '',
      submitterName: '',
      submitterEmail: ''
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Newspaper className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-2xl font-bold">Submit News Story</CardTitle>
          </div>
          <p className="text-gray-600">
            Submit a news story, event, or announcement for review
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Submitter Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="submitterName">Your Name</Label>
                <Input
                  id="submitterName"
                  value={formData.submitterName}
                  onChange={(e) => setFormData({ ...formData, submitterName: e.target.value })}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="submitterEmail">Your Email</Label>
                <Input
                  id="submitterEmail"
                  type="email"
                  value={formData.submitterEmail}
                  onChange={(e) => setFormData({ ...formData, submitterEmail: e.target.value })}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            {/* Story Information */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter story title"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="story">News Story</option>
                <option value="event">Event</option>
                <option value="announcement">Announcement</option>
                <option value="link">External Link</option>
              </select>
            </div>

            <div>
              <Label htmlFor="summary">Brief Summary</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Provide a brief summary or excerpt"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="content">Full Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write the full content of your story (optional for links)"
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {formData.type === 'link' && (
              <div>
                <Label htmlFor="linkUrl">Link URL</Label>
                <Input
                  id="linkUrl"
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="https://example.com"
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Clear Form
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit for Review
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
