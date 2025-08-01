import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { 
  Plus, Edit, Trash2, Eye, CheckCircle, XCircle, MessageSquare, 
  ExternalLink, Calendar, User, Clock, TrendingUp
} from "lucide-react";
import { useAuth } from "../../hooks/use-auth";

interface NewsStory {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  type: 'story' | 'event' | 'link' | 'announcement';
  imageUrl?: string;
  linkUrl?: string;
  tags: string[];
  status: 'draft' | 'pending' | 'approved' | 'published' | 'rejected';
  authorId: string;
  publishDate?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface NewsApproval {
  id: string;
  approved: boolean;
  comments?: string;
  createdAt: string;
  approver: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function NewsManagementSection() {
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<NewsStory | null>(null);
  const [approvals, setApprovals] = useState<NewsApproval[]>([]);
  const [isApprovalsDialogOpen, setIsApprovalsDialogOpen] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    type: 'story' as 'story' | 'event' | 'link' | 'announcement',
    imageUrl: '',
    linkUrl: '',
    tags: '',
    publishDate: ''
  });

  useEffect(() => {
    fetchStories();
  }, [filter]);

  const fetchStories = async () => {
    try {
      const response = await fetch(`/api/news/admin${filter !== 'all' ? `?status=${filter}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStories(data);
      }
    } catch (error) {
      console.error('Failed to fetch news stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovals = async (storyId: string) => {
    try {
      const response = await fetch(`/api/news/${storyId}/approvals`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApprovals(data);
      }
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const storyData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        publishDate: formData.publishDate ? new Date(formData.publishDate).toISOString() : null
      };

      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(storyData)
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        resetForm();
        fetchStories();
      }
    } catch (error) {
      console.error('Failed to create news story:', error);
    }
  };

  const handleUpdateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStory) return;

    try {
      const storyData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        publishDate: formData.publishDate ? new Date(formData.publishDate).toISOString() : null
      };

      const response = await fetch(`/api/news/${selectedStory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(storyData)
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setSelectedStory(null);
        resetForm();
        fetchStories();
      }
    } catch (error) {
      console.error('Failed to update news story:', error);
    }
  };

  const handleSubmitForApproval = async (storyId: string) => {
    try {
      const response = await fetch(`/api/news/${storyId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        fetchStories();
      }
    } catch (error) {
      console.error('Failed to submit story for approval:', error);
    }
  };

  const handleReviewStory = async (storyId: string, approved: boolean, comments?: string) => {
    try {
      const response = await fetch(`/api/news/${storyId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ approved, comments })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Review result:', result);
        
        // Show success message with status update
        if (result.newStatus) {
          console.log(`Story status updated to: ${result.newStatus}`);
        }
        
        fetchStories();
        fetchApprovals(storyId);
      } else {
        const errorData = await response.json();
        console.error('Review failed:', errorData);
        alert(`Failed to review story: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Failed to review story:', error);
      alert('Failed to review story. Please try again.');
    }
  };

  const handlePublishStory = async (storyId: string) => {
    try {
      const response = await fetch(`/api/news/${storyId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        fetchStories();
      }
    } catch (error) {
      console.error('Failed to publish story:', error);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
      const response = await fetch(`/api/news/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        fetchStories();
      }
    } catch (error) {
      console.error('Failed to delete story:', error);
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
      publishDate: ''
    });
  };

  const openEditDialog = (story: NewsStory) => {
    setSelectedStory(story);
    setFormData({
      title: story.title,
      content: story.content || '',
      summary: story.summary || '',
      type: story.type,
      imageUrl: story.imageUrl || '',
      linkUrl: story.linkUrl || '',
      tags: story.tags.join(', '),
      publishDate: story.publishDate ? new Date(story.publishDate).toISOString().slice(0, 16) : ''
    });
    setIsEditDialogOpen(true);
  };

  const openApprovalsDialog = (story: NewsStory) => {
    setSelectedStory(story);
    fetchApprovals(story.id);
    setIsApprovalsDialogOpen(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const canEdit = (story: NewsStory) => {
    return story.authorId === user?.id || user?.role === 'admin';
  };

  const canReview = (story: NewsStory) => {
    return story.status === 'pending' && story.authorId !== user?.id;
  };

  const canPublish = (story: NewsStory) => {
    return story.status === 'approved' && (user?.role === 'admin' || user?.role === 'president' || user?.role === 'project_manager');
  };

  if (loading) {
    return <div className="text-center py-8">Loading news stories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">News Management</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Stories</option>
            <option value="draft">Drafts</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
          </select>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Create Story
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create News Story</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateStory} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="story">Story</option>
                    <option value="event">Event</option>
                    <option value="link">Link</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Brief summary or excerpt"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Full content (optional for links)"
                    rows={6}
                  />
                </div>
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
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
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                <div>
                  <Label htmlFor="publishDate">Publish Date (optional)</Label>
                  <Input
                    id="publishDate"
                    type="datetime-local"
                    value={formData.publishDate}
                    onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Story</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {stories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No news stories found for the selected filter.
          </div>
        ) : (
          stories.map((story) => (
            <Card key={story.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(story.type)}
                    <h3 className="text-lg font-semibold">{story.title}</h3>
                    <Badge className={getStatusBadgeColor(story.status)}>
                      {story.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    By {story.author.firstName} {story.author.lastName} • {new Date(story.createdAt).toLocaleDateString()}
                  </p>
                  {story.summary && (
                    <p className="text-gray-700 mb-2">{story.summary}</p>
                  )}
                  {story.tags.length > 0 && (
                    <div className="flex gap-1 mb-2">
                      {story.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {story.viewCount} views
                    </span>
                    {story.publishDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Publishes {new Date(story.publishDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {canEdit(story) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(story)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {story.status === 'draft' && story.authorId === user?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSubmitForApproval(story.id)}
                    >
                      Submit for Approval
                    </Button>
                  )}
                  {canReview(story) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReviewStory(story.id, true)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReviewStory(story.id, false)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {canPublish(story) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePublishStory(story.id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Publish
                    </Button>
                  )}
                  {story.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openApprovalsDialog(story)}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  )}
                  {canEdit(story) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteStory(story.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit News Story</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateStory} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <select
                id="edit-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="story">Story</option>
                <option value="event">Event</option>
                <option value="link">Link</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-summary">Summary</Label>
              <Textarea
                id="edit-summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Brief summary or excerpt"
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Full content (optional for links)"
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="edit-imageUrl">Image URL</Label>
              <Input
                id="edit-imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            {formData.type === 'link' && (
              <div>
                <Label htmlFor="edit-linkUrl">Link URL</Label>
                <Input
                  id="edit-linkUrl"
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            )}
            <div>
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div>
              <Label htmlFor="edit-publishDate">Publish Date (optional)</Label>
              <Input
                id="edit-publishDate"
                type="datetime-local"
                value={formData.publishDate}
                onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Story</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approvals Dialog */}
      <Dialog open={isApprovalsDialogOpen} onOpenChange={setIsApprovalsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Story Approvals</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {approvals.length === 0 ? (
              <p className="text-gray-500">No reviews yet.</p>
            ) : (
              approvals.map((approval) => (
                <div key={approval.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {approval.approver.firstName} {approval.approver.lastName}
                    </span>
                    <Badge className={approval.approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {approval.approved ? 'Approved' : 'Rejected'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {new Date(approval.createdAt).toLocaleString()}
                  </p>
                  {approval.comments && (
                    <p className="text-sm text-gray-700">{approval.comments}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
