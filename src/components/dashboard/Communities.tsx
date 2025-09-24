import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Calendar } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  location_based: boolean;
  member_count: number;
  created_at: string;
  creator_profile?: {
    username: string;
    full_name: string;
  };
}

const categories = [
  'Art & Culture', 'Sports & Fitness', 'Food & Drink', 'Music & Events',
  'Tech & Innovation', 'Travel & Adventure', 'Learning & Education',
  'Gaming & Entertainment', 'Health & Wellness', 'Social Impact',
];

export const Communities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', location_based: false,
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCommunity = async () => {
    if (!user || !formData.name.trim() || !formData.description.trim() || !formData.category) {
      toast({ title: "Missing information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from('communities').insert({
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location_based: formData.location_based,
        creator_id: user.id,
      });

      if (error) throw error;
      setFormData({ name: '', description: '', category: '', location_based: false });
      setIsCreateDialogOpen(false);
      fetchCommunities();
      toast({ title: "Community created! 🎉", description: "Your community is now live and ready for members." });
    } catch (error) {
      console.error('Error creating community:', error);
      toast({ title: "Failed to create community", description: "Something went wrong. Please try again.", variant: "destructive" });
    }
  };

  if (loading) return <div className="text-center py-8">Loading communities...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Communities</h2>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />Create Community
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader><DialogTitle>Create New Community</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Community name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
              <Textarea placeholder="Description..." value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">Cancel</Button>
                <Button onClick={createCommunity} className="flex-1 bg-gradient-primary hover:opacity-90">Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {communities.map((community) => (
          <Card key={community.id} className="border border-border bg-card/50 backdrop-blur-sm">
            <CardHeader><CardTitle className="text-lg">{community.name}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-3">{community.description}</p>
              <Badge variant="outline">{community.category}</Badge>
              <Button size="sm" className="w-full bg-gradient-primary hover:opacity-90">Join</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};