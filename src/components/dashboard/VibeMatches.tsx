// src/components/dashboard/VibeMatches.jsx
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import {
  Heart, X, MessageCircle, Star, MapPin, Clock, Zap, Users,
  TrendingUp, Brain, Sparkles, Target, RefreshCw, Filter,
  ChevronDown, ChevronUp, Eye, ThumbsUp, Coffee,
  Music, Camera, BookOpen, Gamepad2, Palette, Dumbbell
} from 'lucide-react';

const CompatibilityMeter = ({ score, size = "default" }) => {
  const getColor = (score) => {
    if (score >= 90) return 'text-purple-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getGradientClass = (score) => {
    if (score >= 90) return 'from-purple-500 to-pink-500';
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 70) return 'from-blue-500 to-cyan-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-gray-400 to-gray-500';
  };

  const circumference = 2 * Math.PI * 20;
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`;
  const sizeClasses = size === "small" ? "w-12 h-12" : "w-16 h-16";

  return (
    <div className={`relative ${sizeClasses} flex items-center justify-center`}>
      <div className={`absolute inset-0 bg-gradient-to-r ${getGradientClass(score)} rounded-full opacity-10`}></div>
      <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${getColor(score)}`}>
        {score}%
      </div>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx="50%"
          cy="50%"
          r="20"
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx="50%"
          cy="50%"
          r="20"
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${getColor(score)}`}
        />
      </svg>
    </div>
  );
};

const AIInsights = ({ insights, isVisible, onToggle }) => {
  if (!insights) return null;

  return (
    <div className="mt-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600"
      >
        <Brain className="h-4 w-4" />
        <span>AI Compatibility Insights</span>
        {isVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      
      {isVisible && (
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border animate-in slide-in-from-top duration-200">
          <div className="space-y-3">
            {insights.sharedInterests?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Shared Interests</h4>
                <div className="flex flex-wrap gap-1">
                  {insights.sharedInterests.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {insights.vibeAlignment && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Vibe Alignment</h4>
                <p className="text-xs text-gray-600">{insights.vibeAlignment}</p>
              </div>
            )}
            
            {insights.conversationStarters?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Conversation Starters</h4>
                <ul className="space-y-1">
                  {insights.conversationStarters.slice(0, 2).map((starter, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-start">
                      <Sparkles className="h-3 w-3 mr-1 mt-0.5 text-purple-500" />
                      {starter}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {insights.activitySuggestions?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Activity Ideas</h4>
                <div className="flex flex-wrap gap-1">
                  {insights.activitySuggestions.slice(0, 3).map((activity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {activity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MatchCard = ({ match, onLike, onPass, onMessage, currentUser }) => {
  const [showInsights, setShowInsights] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isPassing, setIsPassing] = useState(false);

  const handleLike = async () => {
    setIsLiking(true);
    await onLike(match.id);
    setIsLiking(false);
  };

  const handlePass = async () => {
    setIsPassing(true);
    await onPass(match.id);
    setIsPassing(false);
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getActivityIcon = (activity) => {
    const icons = {
      'Coffee': Coffee,
      'Music': Music,
      'Photography': Camera,
      'Reading': BookOpen,
      'Gaming': Gamepad2,
      'Art': Palette,
      'Fitness': Dumbbell
    };
    const Icon = icons[activity] || Target;
    return <Icon className="h-3 w-3" />;
  };

  // Create fallback profile data if needed
  const profile = match.profile || match.matched_user || {
    full_name: 'Unknown User',
    bio: 'No bio available',
    avatar_url: null,
    interests: []
  };

  return (
    <div className="w-full max-w-sm mx-auto transition-all duration-300 hover:scale-105">
      <Card className="relative overflow-hidden bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
        {/* Header with compatibility score */}
        <div className="absolute top-4 right-4 z-10">
          <CompatibilityMeter score={match.compatibility_score || 75} size="small" />
        </div>

        {/* Profile Image */}
        <div className="relative h-64 bg-gradient-to-br from-purple-400 to-blue-500">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {profile.full_name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          )}
          
          {/* Online status */}
          {profile.is_online && (
            <div className="absolute bottom-4 left-4 flex items-center space-x-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>Online</span>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Name and Age */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {profile.full_name}
              </h3>
              {profile.age && (
                <p className="text-sm text-gray-600">{profile.age} years old</p>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">{match.match_score || 4.8}</span>
            </div>
          </div>

          {/* Current Activity and Mood */}
          {match.current_vibe && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {match.current_vibe.mood}
                  </Badge>
                  {match.current_vibe.activity && (
                    <Badge variant="outline" className="text-xs flex items-center space-x-1">
                      {getActivityIcon(match.current_vibe.activity)}
                      <span>{match.current_vibe.activity}</span>
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {getTimeAgo(match.current_vibe.created_at)}
                </span>
              </div>
              {match.current_vibe.content && (
                <p className="text-sm text-gray-700 line-clamp-2">
                  {match.current_vibe.content}
                </p>
              )}
            </div>
          )}

          {/* Distance */}
          {match.distance && (
            <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
              <MapPin className="h-4 w-4" />
              <span>{match.distance}</span>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {profile.bio}
            </p>
          )}

          {/* Interests/Tags */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {profile.interests.slice(0, 4).map((interest, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
                {profile.interests.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{profile.interests.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* AI Insights */}
          {match.ai_insights && (
            <AIInsights
              insights={match.ai_insights}
              isVisible={showInsights}
              onToggle={() => setShowInsights(!showInsights)}
            />
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePass}
              disabled={isPassing}
              className="flex-1 border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              {isPassing ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Pass
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMessage(match)}
              className="flex-1 border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Message
            </Button>
            
            <Button
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              {isLiking ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-1" />
                  Like
                </>
              )}
            </Button>
          </div>

          {/* Match Reasons */}
          {match.match_reasons && match.match_reasons.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Why you matched:</div>
              <div className="flex flex-wrap gap-1">
                {match.match_reasons.slice(0, 2).map((reason, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const FilterPanel = ({ filters, onFiltersChange, isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="mb-6 p-4 bg-white border rounded-lg shadow-sm animate-in slide-in-from-top duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Filter Matches</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Distance */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Distance (km)
          </label>
          <select
            value={filters.maxDistance || 50}
            onChange={(e) => onFiltersChange({ ...filters, maxDistance: parseInt(e.target.value) })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
          </select>
        </div>

        {/* Age Range */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Age Range
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minAge || ''}
              onChange={(e) => onFiltersChange({ ...filters, minAge: parseInt(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              min="18"
              max="100"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxAge || ''}
              onChange={(e) => onFiltersChange({ ...filters, maxAge: parseInt(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              min="18"
              max="100"
            />
          </div>
        </div>

        {/* Compatibility Score */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Min Compatibility
          </label>
          <select
            value={filters.minCompatibility || 50}
            onChange={(e) => onFiltersChange({ ...filters, minCompatibility: parseInt(e.target.value) })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value={50}>50%</option>
            <option value={60}>60%</option>
            <option value={70}>70%</option>
            <option value={80}>80%</option>
            <option value={90}>90%</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => onFiltersChange({})}>
          Clear All
        </Button>
        <Button size="sm" onClick={onClose}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

const TabButton = ({ value, icon: Icon, label, count, isActive, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(value)}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-blue-500 text-white' 
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
    {count > 0 && (
      <Badge variant={isActive ? "secondary" : "outline"} className="text-xs">
        {count}
      </Badge>
    )}
  </button>
);

export const VibeMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();

  const showToast = (title, description, type = 'default') => {
    // Replace with your toast system
    console.log(`${type.toUpperCase()}: ${title} - ${description}`);
  };

  useEffect(() => {
    if (user) {
      loadMatches();
    }
  }, [user, filters]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      
      // Build query based on active tab and filters
      let query = supabase
        .from('vibe_matches')
        .select(`
          *,
          matched_user:profiles!vibe_matches_matched_user_id_fkey(
            id,
            full_name,
            avatar_url,
            bio,
            age,
            interests,
            is_online,
            last_seen
          ),
          current_vibe:vibe_echoes(
            content,
            mood,
            activity,
            created_at,
            media_url,
            media_type
          )
        `)
        .eq('user_id', user.id);

      if (activeTab === 'mutual') {
        query = query.eq('is_mutual', true);
      } else if (activeTab === 'liked') {
        query = query.eq('user_liked', true);
      }

      // Apply filters
      if (filters.minCompatibility) {
        query = query.gte('compatibility_score', filters.minCompatibility);
      }

      const { data, error } = await query
        .order('compatibility_score', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Generate AI insights for top matches (simplified version)
      const enhancedMatches = data.map((match) => {
        const profile = match.matched_user;
        const distance = Math.floor(Math.random() * 50) + 1 + ' km'; // Mock distance
        
        // Generate simple AI insights
        const sharedInterests = ['Music', 'Coffee', 'Travel']; // Mock data
        const ai_insights = {
          sharedInterests,
          vibeAlignment: match.compatibility_score > 80 
            ? "High energy alignment - you both seem to have compatible vibes!"
            : "Good potential for connection based on your shared interests.",
          conversationStarters: [
            `Ask about their interest in ${sharedInterests[0] || 'music'}`,
            "Share your recent adventure or ask about theirs"
          ],
          activitySuggestions: ["Coffee chat", "Virtual hangout", "Local event"]
        };

        return {
          ...match,
          profile,
          ai_insights,
          distance,
          match_reasons: ['Similar interests', 'Compatible schedules']
        };
      });

      setMatches(enhancedMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
      showToast("Failed to load matches", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (matchId) => {
    try {
      const { error } = await supabase
        .from('vibe_matches')
        .update({ 
          user_liked: true,
          liked_at: new Date().toISOString()
        })
        .eq('id', matchId);

      if (error) throw error;

      // Check if it's a mutual match
      const match = matches.find(m => m.id === matchId);
      if (match?.matched_user_liked) {
        showToast("It's a match! 🎉", `You and ${match.profile?.full_name} liked each other!`);
      } else {
        showToast("Like sent!", "They'll be notified of your interest.");
      }

      await loadMatches();
    } catch (error) {
      showToast("Failed to like", error.message, "error");
    }
  };

  const handlePass = async (matchId) => {
    try {
      const { error } = await supabase
        .from('vibe_matches')
        .update({ user_passed: true })
        .eq('id', matchId);

      if (error) throw error;

      setMatches(matches.filter(m => m.id !== matchId));
      showToast("Passed", "This match has been removed from your feed.");
    } catch (error) {
      showToast("Failed to pass", error.message, "error");
    }
  };

  const handleMessage = async (match) => {
    try {
      // Create or find existing chat
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${match.profile.id}),and(user1_id.eq.${match.profile.id},user2_id.eq.${user.id})`)
        .single();

      let chatId;
      if (existingChat) {
        _chatId = existingChat.id;
      } else {
        const { data: newChat, error } = await supabase
          .from('chats')
          .insert([{
            user1_id: user.id,
            user2_id: match.profile.id,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;
        _chatId = newChat.id;
      }

      showToast("Opening chat...", `Starting conversation with ${match.profile.full_name}`);
    } catch (error) {
      showToast("Failed to start chat", error.message, "error");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMatches();
    setIsRefreshing(false);
    showToast("Matches refreshed!", "Found new potential connections for you.");
  };

  // Filter matches based on active tab
  const getFilteredMatches = () => {
    switch (activeTab) {
      case 'liked':
        return matches.filter(m => m.user_liked);
      case 'mutual':
        return matches.filter(m => m.is_mutual);
      case 'discover':
      default:
        return matches.filter(m => !m.user_liked && !m.user_passed);
    }
  };

  const filteredMatches = getFilteredMatches();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Finding your vibe matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <span>Vibe Matches</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Discover people who match your energy and interests
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        isVisible={showFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-2 mb-4">
          <TabButton 
            value="discover" 
            icon={Eye} 
            label="Discover" 
            count={matches.filter(m => !m.user_liked && !m.user_passed).length}
            isActive={activeTab === 'discover'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            value="liked" 
            icon={ThumbsUp} 
            label="Liked" 
            count={matches.filter(m => m.user_liked).length}
            isActive={activeTab === 'liked'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            value="mutual" 
            icon={Heart} 
            label="Mutual" 
            count={matches.filter(m => m.is_mutual).length}
            isActive={activeTab === 'mutual'} 
            onClick={setActiveTab} 
          />
        </div>

        {/* Match Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{matches.length}</div>
            <div className="text-xs text-purple-600">Potential Matches</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {matches.filter(m => m.is_mutual).length}
            </div>
            <div className="text-xs text-green-600">Mutual Likes</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {matches.filter(m => m.user_liked).length}
            </div>
            <div className="text-xs text-blue-600">You Liked</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {matches.filter(m => m.compatibility_score > 80).length}
            </div>
            <div className="text-xs text-yellow-600">High Compatibility</div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {activeTab === 'discover' && 'No New Matches'}
            {activeTab === 'liked' && 'No Likes Yet'}
            {activeTab === 'mutual' && 'No Mutual Matches'}
          </h3>
          <p className="text-gray-600 mb-4">
            {activeTab === 'discover' && "We're looking for new people who match your vibe. Check back soon!"}
            {activeTab === 'liked' && 'Start liking people in the Discover tab to see them here.'}
            {activeTab === 'mutual' && 'When someone likes you back, they\'ll appear here as mutual matches.'}
          </p>
          <Button onClick={activeTab !== 'discover' ? () => setActiveTab('discover') : handleRefresh}>
            {activeTab !== 'discover' ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Discover Matches
              </>
            ) : (
              <>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Check for New Matches
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mutual matches celebration */}
          {activeTab === 'mutual' && filteredMatches.length > 0 && (
            <div className="text-center p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">🎉 Congratulations!</h3>
              <p className="text-gray-700">
                You have {filteredMatches.length} mutual {filteredMatches.length === 1 ? 'match' : 'matches'}! 
                These people liked you back.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMatches.map((match) => (
              <div key={match.id} className="relative">
                {/* Mutual match badge */}
                {match.is_mutual && activeTab === 'mutual' && (
                  <div className="absolute -top-2 -right-2 z-20 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    MUTUAL MATCH! 🔥
                  </div>
                )}
                
                <MatchCard
                  match={match}
                  onLike={handleLike}
                  onPass={handlePass}
                  onMessage={handleMessage}
                  currentUser={user}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col space-y-2">
          <Button
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 shadow-lg"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="shadow-lg bg-white"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* AI Matching Status */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900">AI Matching Engine</h4>
            <p className="text-xs text-blue-700 mt-1">
              Our AI analyzes your interests, activities, and vibe patterns to find the most compatible matches. 
              The more you use the app, the better your matches become!
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className="mt-3 flex items-center space-x-4 text-xs text-blue-600">
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>Matching accuracy improving</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="h-3 w-3" />
            <span>Real-time vibe analysis</span>
          </div>
          <div className="flex items-center space-x-1">
            <Target className="h-3 w-3" />
            <span>Personalized recommendations</span>
          </div>
        </div>
      </div>

      {/* Tips for Better Matches */}
      <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
        <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center">
          <Sparkles className="h-4 w-4 mr-2" />
          Tips for Better Matches
        </h4>
        <ul className="text-xs text-yellow-800 space-y-1">
          <li>• Share vibe echoes regularly to help our AI understand your personality</li>
          <li>• Update your interests and bio to attract like-minded people</li>
          <li>• Be active in the app - engagement improves match quality</li>
          <li>• Try different moods and activities to discover new types of connections</li>
        </ul>
      </div>
    </div>
  );
};