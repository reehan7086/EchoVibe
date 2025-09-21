import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Heart, MessageCircle, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Match {
  id: string;
  compatibility_score: number;
  matched_at: string;
  chat_started: boolean;
  user1_id: string;
  user2_id: string;
  other_user: {
    username: string;
    full_name: string;
    avatar_url?: string;
    bio?: string;
    vibe_score: number;
  };
}

export const Matches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
    if (!user) return;

    try {
      // Get all matches for the user
      const { data: matchData, error } = await supabase
        .from('vibe_matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('is_active', true)
        .order('matched_at', { ascending: false });

      if (error) throw error;

      if (matchData) {
        // Get profile data for other users
        const otherUserIds = matchData.map(match => 
          match.user1_id === user.id ? match.user2_id : match.user1_id
        );

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, avatar_url, bio, vibe_score')
          .in('user_id', otherUserIds);

        if (profilesError) throw profilesError;

        // Combine match and profile data
        const enrichedMatches = matchData.map(match => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          const otherUserProfile = profilesData?.find(p => p.user_id === otherUserId);
          
          return {
            ...match,
            other_user: otherUserProfile ? {
              username: otherUserProfile.username,
              full_name: otherUserProfile.full_name,
              avatar_url: otherUserProfile.avatar_url,
              bio: otherUserProfile.bio,
              vibe_score: otherUserProfile.vibe_score
            } : {
              username: 'Unknown',
              full_name: 'Unknown User',
              avatar_url: undefined,
              bio: undefined,
              vibe_score: 0
            }
          };
        });

        setMatches(enrichedMatches);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (match: Match) => {
    try {
      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('match_id', match.id)
        .single();

      if (!existingChat) {
        // Create new chat
        const { error } = await supabase
          .from('chats')
          .insert({
            match_id: match.id,
            user1_id: match.user1_id,
            user2_id: match.user2_id,
          });

        if (error) throw error;

        // Update match to mark chat as started
        await supabase
          .from('vibe_matches')
          .update({ chat_started: true })
          .eq('id', match.id);
      }

      // TODO: Navigate to chat or open chat interface
      console.log('Chat started for match:', match.id);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 0.9) return 'Perfect Match';
    if (score >= 0.8) return 'Great Match';
    if (score >= 0.6) return 'Good Match';
    return 'Potential Match';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-muted rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Your Matches</h2>
        </div>
        <Badge variant="secondary" className="text-sm">
          {matches.length} matches
        </Badge>
      </div>

      {matches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl">💫</div>
              <h3 className="text-xl font-semibold">No matches yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Keep sharing your vibes and engaging with the community. Your perfect match might be just around the corner!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <Card key={match.id} className="border border-border bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="secondary" 
                    className={`flex items-center gap-1 ${getCompatibilityColor(match.compatibility_score)} text-white`}
                  >
                    <Sparkles className="h-3 w-3" />
                    {Math.round(match.compatibility_score * 100)}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(match.matched_at), { addSuffix: true })}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={match.other_user.avatar_url} />
                    <AvatarFallback className="bg-gradient-primary text-white text-lg">
                      {match.other_user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <h4 className="font-semibold text-lg">{match.other_user.full_name}</h4>
                    <p className="text-sm text-muted-foreground">@{match.other_user.username}</p>
                    <Badge variant="outline" className="text-xs">
                      ⚡ {match.other_user.vibe_score} vibe score
                    </Badge>
                  </div>

                  {match.other_user.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {match.other_user.bio}
                    </p>
                  )}

                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {getCompatibilityLabel(match.compatibility_score)}
                    </Badge>
                  </div>
                </div>

                <Button 
                  onClick={() => startChat(match)}
                  className="w-full bg-gradient-primary hover:opacity-90"
                  disabled={match.chat_started}
                >
                  {match.chat_started ? (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Continue Chat
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Start Conversation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};