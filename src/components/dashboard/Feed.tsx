import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle, Clock } from 'lucide-react';
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
  profile: {
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

export const Feed = () => {
  const [vibes, setVibes] = useState<VibeEcho[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVibes();
  }, []);

  const fetchVibes = async () => {
    try {
      const { data: vibeData, error } = await supabase
        .from('vibe_echoes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (vibeData) {
        const userIds = vibeData.map(vibe => vibe.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, avatar_url, vibe_score')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const enrichedVibes = vibeData.map(vibe => {
          const profile = profilesData?.find(p => p.user_id === vibe.user_id);
          return {
            ...vibe,
            profile: profile || { username: 'unknown', full_name: 'Unknown User', vibe_score: 0 }
          };
        });

        setVibes(enrichedVibes);
      }
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
                  <AvatarImage src={vibe.profile.avatar_url} />
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {vibe.profile.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{vibe.profile.full_name}</h4>
                    <span className="text-sm text-muted-foreground">@{vibe.profile.username}</span>
                    <Badge variant="outline" className="text-xs">⚡ {vibe.profile.vibe_score}</Badge>
                  </div>
                  <p className="text-foreground leading-relaxed">{vibe.content}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${moodColors[vibe.mood]}`} />
                      {moodEmojis[vibe.mood]} {vibe.mood}
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