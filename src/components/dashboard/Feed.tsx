import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  testSupabaseConnection, 
  fetchVibeEchoesProd, 
  fetchVibeEchoesDirectAPI,
  checkDeploymentEnv
} from '@/utils/supabaseDebug';

interface VibeEcho {
  id: string;
  content: string;
  mood: string;
  activity?: string;
  created_at: string;
  likes_count: number;
  responses_count: number;
  user_id?: string;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url?: string;
    vibe_score?: number;
  } | null;
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

// Debug Panel Component
const DebugPanel: React.FC<{ 
  connectionStatus: boolean | null, 
  vibeCount: number, 
  error: string | null 
}> = ({ connectionStatus, vibeCount, error }) => (
  <div style={{ 
    position: 'fixed', 
    top: '10px', 
    right: '10px', 
    background: '#f0f0f0', 
    padding: '10px', 
    fontSize: '12px',
    maxWidth: '300px',
    zIndex: 9999,
    borderRadius: '4px',
    border: '1px solid #ccc'
  }}>
    <strong>🔧 EchoVibe Debug:</strong><br/>
    Env URL: {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}<br/>
    Env Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}<br/>
    Connection: {connectionStatus === null ? '⏳' : connectionStatus ? '✅' : '❌'}<br/>
    Vibes Loaded: {vibeCount}<br/>
    {error && <span style={{color: 'red'}}>Error: {error}</span>}
  </div>
);

export const Feed: React.FC = () => {
  const [vibes, setVibes] = useState<VibeEcho[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);

  useEffect(() => {
    const initializeFeed = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🚀 Initializing EchoVibe Feed...');
        
        // Step 1: Check environment and test connection
        checkDeploymentEnv();
        const testResult = await testSupabaseConnection();
        setConnectionStatus(testResult.success);
        
        if (!testResult.success) {
          throw new Error(`Connection failed: ${testResult.error}`);
        }
        
        // Step 2: Try to fetch data
        let data: VibeEcho[] = [];
        try {
          console.log('📡 Attempting Supabase client fetch...');
          const rawData = await fetchVibeEchoesProd();
          data = rawData.map(item => ({
            id: item.id,
            content: item.content,
            mood: item.mood,
            activity: item.activity,
            created_at: item.created_at,
            likes_count: item.likes_count || 0,
            responses_count: item.responses_count || 0,
            user_id: item.user_id,
            profiles: item.profiles && typeof item.profiles === 'object' && item.profiles !== null && 'username' in item.profiles 
              ? item.profiles as { username: string; full_name: string; avatar_url?: string; vibe_score?: number }
              : null
          }));
        } catch (clientError) {
          console.log('⚠️ Supabase client failed, trying direct API...');
          try {
            const rawData = await fetchVibeEchoesDirectAPI();
            data = rawData.map(item => ({
              id: item.id,
              content: item.content,
              mood: item.mood,
              activity: item.activity,
              created_at: item.created_at,
              likes_count: item.likes_count || 0,
              responses_count: item.responses_count || 0,
              user_id: item.user_id,
              profiles: item.profiles && typeof item.profiles === 'object' && 'username' in item.profiles 
                ? item.profiles as { username: string; full_name: string; avatar_url?: string; vibe_score?: number }
                : null
            }));
          } catch (apiError) {
            console.error('❌ Both methods failed:', { clientError, apiError });
            throw new Error('All fetch methods failed');
          }
        }
        
        console.log('✅ Successfully loaded', data.length, 'vibe echoes');
        setVibes(data);
        
      } catch (err: any) {
        console.error('❌ Feed initialization failed:', err);
        setError(err.message || 'Failed to load vibe echoes');
        
        // Fallback to mock data for development
        console.log('📝 Using mock data as fallback...');
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
            profiles: {
              username: 'fitguru',
              full_name: 'Sarah Fitness',
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
            profiles: {
              username: 'wordsmith',
              full_name: 'Alex Writer',
              vibe_score: 92
            }
          }
        ];
        setVibes(mockVibes);
        
      } finally {
        setLoading(false);
      }
    };

    initializeFeed();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <DebugPanel connectionStatus={connectionStatus} vibeCount={0} error={error} />
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>🔄 Loading vibes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DebugPanel connectionStatus={connectionStatus} vibeCount={vibes.length} error={error} />
      
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Vibe Feed</h2>
        <Badge {...{ variant: "secondary" } as any}>{vibes.length} vibes</Badge>
      </div>
      
      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">⚠️</span>
              <div>
                <p className="text-sm font-medium text-yellow-800">Connection Issue</p>
                <p className="text-xs text-yellow-600">{error}</p>
                <p className="text-xs text-yellow-600 mt-1">Showing fallback data.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="space-y-4">
        {vibes.map((vibe) => (
          <Card key={vibe.id} className="border border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={vibe.profiles?.avatar_url} />
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {vibe.profiles?.username?.slice(0, 2).toUpperCase() || vibe.profiles?.full_name?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{vibe.profiles?.full_name || 'Unknown User'}</h4>
                    <span className="text-sm text-muted-foreground">@{vibe.profiles?.username || 'unknown'}</span>
                    {vibe.profiles?.vibe_score && (
                      <Badge {...{ variant: "outline", className: "text-xs" } as any}>⚡ {vibe.profiles.vibe_score}</Badge>
                    )}
                  </div>
                  
                  <p className="text-foreground leading-relaxed">{vibe.content}</p>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge {...{ variant: "secondary", className: "flex items-center gap-1" } as any}>
                      <div className={`w-2 h-2 rounded-full ${moodColors[vibe.mood] || 'bg-gray-500'}`} />
                      {moodEmojis[vibe.mood] || '🤔'} {vibe.mood}
                    </Badge>
                    
                    {vibe.activity && (
                      <Badge {...{ variant: "outline", className: "flex items-center gap-1" } as any}>
                        <Clock className="h-3 w-3" />
                        {vibe.activity}
                      </Badge>
                    )}
                    
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(vibe.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
                    <span>💖 {vibe.likes_count} likes</span>
                    <span>💬 {vibe.responses_count} responses</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {vibes.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl">🌊</div>
              <h3 className="text-xl font-semibold">No vibes yet</h3>
              <p className="text-muted-foreground">
                Be the first to share your vibe and start connecting!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};