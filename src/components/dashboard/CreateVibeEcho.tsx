import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Smile, MapPin, Clock } from 'lucide-react';

const moods = [
  { value: 'happy', label: '😊 Happy', color: 'bg-yellow-500' },
  { value: 'excited', label: '🎉 Excited', color: 'bg-orange-500' },
  { value: 'calm', label: '😌 Calm', color: 'bg-blue-500' },
  { value: 'adventurous', label: '🚀 Adventurous', color: 'bg-purple-500' },
  { value: 'creative', label: '🎨 Creative', color: 'bg-pink-500' },
  { value: 'social', label: '👥 Social', color: 'bg-green-500' },
  { value: 'thoughtful', label: '🤔 Thoughtful', color: 'bg-indigo-500' },
  { value: 'energetic', label: '⚡ Energetic', color: 'bg-red-500' },
];

const activities = [
  'Coffee', 'Food', 'Movies', 'Music', 'Art', 'Sports', 'Reading', 
  'Gaming', 'Travel', 'Nature', 'Photography', 'Dancing', 'Studying'
];

export const CreateVibeEcho = () => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [activity, setActivity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim() || !mood) {
      toast({
        title: "Incomplete vibe",
        description: "Please add content and select a mood for your vibe echo.",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('vibe_echoes')
        .insert({
          user_id: user.id,
          content: content.trim(),
          mood,
          activity: activity || null,
          media_type: 'text',
        });

      if (error) throw error;

      setContent('');
      setMood('');
      setActivity('');
      
      toast({
        title: "Vibe echo shared! 🎉",
        description: "Your vibe is now live and visible to the community.",
      });
    } catch (error) {
      console.error('Error creating vibe echo:', error);
      toast({
        title: "Failed to share vibe",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMood = moods.find(m => m.value === mood);

  return (
    <Card className="border border-border bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Smile className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Share Your Vibe</h3>
          </div>

          <Textarea
            placeholder="What's your vibe right now? Share what you're feeling, thinking, or doing..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none border-border/50 focus:border-primary"
            maxLength={500}
          />

          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Mood</label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger className="border-border/50">
                  <SelectValue placeholder="Select your mood" />
                </SelectTrigger>
                <SelectContent>
                  {moods.map((moodOption) => (
                    <SelectItem key={moodOption.value} value={moodOption.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${moodOption.color}`} />
                        {moodOption.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Activity (Optional)</label>
              <Select value={activity} onValueChange={setActivity}>
                <SelectTrigger className="border-border/50">
                  <SelectValue placeholder="What are you up to?" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((act) => (
                    <SelectItem key={act} value={act}>
                      {act}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedMood && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${selectedMood.color}`} />
                  {selectedMood.label}
                </Badge>
              )}
              {activity && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {activity}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {content.length}/500
              </span>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !content.trim() || !mood}
                className="bg-gradient-primary hover:opacity-90"
              >
                {isSubmitting ? 'Sharing...' : 'Share Vibe'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};