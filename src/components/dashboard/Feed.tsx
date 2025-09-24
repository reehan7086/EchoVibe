import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VibeEcho {
  id: string;
  content: string;
  mood: string;
  activity?: string;
  created_at: string;
  likes_count: number;
  responses_count: number;
  user_id: string;
  profile?: {
    username: string;
    full_name: string;
    avatar_url?: string;
    vibe_score: number;
  };
}

const moodColors: Record<string, string> = {
  happy: 'bg-yellow-500',
  excited: 'bg-orange-500',
  calm: 'bg-blue-500',
  adventurous: 'bg-purple-500',
  creative: 'bg-pink-500',
  social: 'bg-green-500',
  thoughtful: 'bg-indigo-500',
  energetic: 'bg-red-500',
};

const moodEmojis: Record<string, string> = {
  happy: '😊',
  excited: '🎉',
  calm: '😌',
  adventurous: '🚀',
  creative: '🎨',
  social: '👥',
  thoughtful: '🤔',
  energetic: '⚡',
};

export const Feed: React.FC = () => {
  const [vibes, setVibes] = useState<VibeEcho[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVibes();
  }, []);

  const fetchVibes = async () => {
    try {
      // Mock data for development
      const mockVibes: VibeEcho[] = [
        {
          id: '1',
          content: "Just finished an amazing workout! Feeling so energized and ready to take on the day 💪",
          mood: 'energetic',
          activity: 'Fitness',
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          likes_count: 5,
          responses_count: 2,
          user_id: 'mock-user-1',
          profile: {
            username: 'fitguru',
            full_name: 'Sarah Fitness',
            avatar_url: undefined,
            vibe_score: 85
          }
        },
        {
          id: '2',
          content: "Found this amazing little coffee shop downtown. The vibes here are perfect for some creative writing ☕️📝",
          mood: 'creative',
          activity: 'Coffee',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          likes_count: 12,
          responses_count: 7,
          user_id: 'mock-user-2',
          profile: {
            username: 'wordsmith',
            full_name: 'Alex Writer',
            avatar_url: undefined,
            vibe_score: 92
          }
        }
      ];
      
      setVibes(mockVibes);
    } catch (error) {
      console.error('Error fetching vibes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading vibes...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Vibe Feed</h2>
      <div className="space-y-4">
        {vibes.map((vibe) => (
          <Card key={vibe.id} className="border border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={vibe.profile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {vibe.profile?.username.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{vibe.profile?.full_name || 'Unknown User'}</h4>
                    <span className="text-sm text-muted-foreground">@{vibe.profile?.username || 'unknown'}</span>
                    <Badge variant="outline" className="text-xs">⚡ {vibe.profile?.vibe_score || 0}</Badge>
                  </div>
                  <p className="text-foreground leading-relaxed">{vibe.content}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${moodColors[vibe.mood] || 'bg-gray-500'}`} />
                      {moodEmojis[vibe.mood] || '🤔'} {vibe.mood}
                    </Badge>
                    {vibe.activity && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {vibe.activity}
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(vibe.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};