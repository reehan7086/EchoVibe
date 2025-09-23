// src/services/aiMatching.ts
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  bio?: string;
  vibe_score: number;
  location?: { coordinates: [number, number] };
  city?: string;
}

interface VibeEcho {
  mood: string;
  activity?: string;
  content: string;
  created_at: string;
}

interface MatchingFactors {
  moodCompatibility: number;
  activityAlignment: number;
  vibeScoreSimilarity: number;
  locationProximity: number;
  interactionHistory: number;
  contentSimilarity: number;
}

// Mood compatibility matrix (how well moods match)
const MOOD_COMPATIBILITY: Record<string, Record<string, number>> = {
  happy: { happy: 1.0, excited: 0.9, calm: 0.6, adventurous: 0.8, creative: 0.7, social: 0.9, thoughtful: 0.5, energetic: 0.8 },
  excited: { happy: 0.9, excited: 1.0, calm: 0.4, adventurous: 0.9, creative: 0.8, social: 0.9, thoughtful: 0.4, energetic: 1.0 },
  calm: { happy: 0.6, excited: 0.4, calm: 1.0, adventurous: 0.5, creative: 0.7, social: 0.5, thoughtful: 0.9, energetic: 0.3 },
  adventurous: { happy: 0.8, excited: 0.9, calm: 0.5, adventurous: 1.0, creative: 0.8, social: 0.8, thoughtful: 0.6, energetic: 0.9 },
  creative: { happy: 0.7, excited: 0.8, calm: 0.7, adventurous: 0.8, creative: 1.0, social: 0.7, thoughtful: 0.8, energetic: 0.7 },
  social: { happy: 0.9, excited: 0.9, calm: 0.5, adventurous: 0.8, creative: 0.7, social: 1.0, thoughtful: 0.6, energetic: 0.8 },
  thoughtful: { happy: 0.5, excited: 0.4, calm: 0.9, adventurous: 0.6, creative: 0.8, social: 0.6, thoughtful: 1.0, energetic: 0.4 },
  energetic: { happy: 0.8, excited: 1.0, calm: 0.3, adventurous: 0.9, creative: 0.7, social: 0.8, thoughtful: 0.4, energetic: 1.0 }
};

// Activity compatibility scoring
const ACTIVITY_CATEGORIES: Record<string, string[]> = {
  social: ['Coffee', 'Food', 'Dancing', 'Movies', 'Music'],
  creative: ['Art', 'Photography', 'Music', 'Reading'],
  active: ['Sports', 'Dancing', 'Nature', 'Travel'],
  intellectual: ['Reading', 'Studying', 'Art'],
  entertainment: ['Gaming', 'Movies', 'Music']
};

export class AIMatchingService {
  // Calculate compatibility between two users
  static async calculateCompatibility(
    user1Id: string,
    user2Id: string
  ): Promise<number> {
    try {
      // Fetch user profiles
      const [profile1, profile2] = await Promise.all([
        this.getUserProfile(user1Id),
        this.getUserProfile(user2Id)
      ]);

      if (!profile1 || !profile2) return 0;

      // Fetch recent vibe echoes for both users
      const [vibes1, vibes2] = await Promise.all([
        this.getRecentVibes(user1Id),
        this.getRecentVibes(user2Id)
      ]);

      // Calculate matching factors
      const factors = await this.calculateMatchingFactors(
        profile1, 
        profile2, 
        vibes1, 
        vibes2
      );

      // Weighted average of all factors
      const weights = {
        moodCompatibility: 0.25,
        activityAlignment: 0.20,
        vibeScoreSimilarity: 0.15,
        locationProximity: 0.20,
        interactionHistory: 0.10,
        contentSimilarity: 0.10
      };

      const compatibility = Object.entries(factors).reduce((sum, [key, value]) => {
        return sum + (value * weights[key as keyof typeof weights]);
      }, 0);

      return Math.min(Math.max(compatibility, 0), 1); // Clamp between 0 and 1
    } catch (error) {
      console.error('Error calculating compatibility:', error);
      return 0;
    }
  }

  // Get user profile
  private static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  }

  // Get recent vibe echoes
  private static async getRecentVibes(userId: string): Promise<VibeEcho[]> {
    const { data, error } = await supabase
      .from('vibe_echoes')
      .select('mood, activity, content, created_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching vibes:', error);
      return [];
    }

    return data || [];
  }

  // Calculate all matching factors
  private static async calculateMatchingFactors(
    profile1: UserProfile,
    profile2: UserProfile,
    vibes1: VibeEcho[],
    vibes2: VibeEcho[]
  ): Promise<MatchingFactors> {
    return {
      moodCompatibility: this.calculateMoodCompatibility(vibes1, vibes2),
      activityAlignment: this.calculateActivityAlignment(vibes1, vibes2),
      vibeScoreSimilarity: this.calculateVibeScoreSimilarity(profile1, profile2),
      locationProximity: this.calculateLocationProximity(profile1, profile2),
      interactionHistory: await this.calculateInteractionHistory(profile1.user_id, profile2.user_id),
      contentSimilarity: this.calculateContentSimilarity(vibes1, vibes2, profile1, profile2)
    };
  }

  // Calculate mood compatibility based on recent vibes
  private static calculateMoodCompatibility(vibes1: VibeEcho[], vibes2: VibeEcho[]): number {
    if (vibes1.length === 0 || vibes2.length === 0) return 0.5;

    const recentMoods1 = vibes1.slice(0, 5).map(v => v.mood);
    const recentMoods2 = vibes2.slice(0, 5).map(v => v.mood);

    let totalCompatibility = 0;
    let comparisons = 0;

    for (const mood1 of recentMoods1) {
      for (const mood2 of recentMoods2) {
        const compatibility = MOOD_COMPATIBILITY[mood1]?.[mood2] || 0.5;
        totalCompatibility += compatibility;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalCompatibility / comparisons : 0.5;
  }

  // Calculate activity alignment
  private static calculateActivityAlignment(vibes1: VibeEcho[], vibes2: VibeEcho[]): number {
    const activities1 = vibes1.filter(v => v.activity).map(v => v.activity!);
    const activities2 = vibes2.filter(v => v.activity).map(v => v.activity!);

    if (activities1.length === 0 || activities2.length === 0) return 0.5;

    // Find shared activity categories
    const getCategories = (activities: string[]) => {
      const categories = new Set<string>();
      activities.forEach(activity => {
        Object.entries(ACTIVITY_CATEGORIES).forEach(([category, acts]) => {
          if (acts.includes(activity)) {
            categories.add(category);
          }
        });
      });
      return Array.from(categories);
    };

    const categories1 = getCategories(activities1);
    const categories2 = getCategories(activities2);

    const sharedCategories = categories1.filter(c => categories2.includes(c));
    const totalCategories = new Set([...categories1, ...categories2]).size;

    return totalCategories > 0 ? (sharedCategories.length * 2) / totalCategories : 0.5;
  }

  // Calculate vibe score similarity
  private static calculateVibeScoreSimilarity(profile1: UserProfile, profile2: UserProfile): number {
    const diff = Math.abs(profile1.vibe_score - profile2.vibe_score);
    const maxScore = Math.max(profile1.vibe_score, profile2.vibe_score, 100);
    
    // Convert difference to 0-1 scale (smaller difference = higher score)
    return 1 - (diff / maxScore);
  }

  // Calculate location proximity
  private static calculateLocationProximity(profile1: UserProfile, profile2: UserProfile): number {
    if (!profile1.location?.coordinates || !profile2.location?.coordinates) {
      // If same city, give moderate score
      if (profile1.city && profile2.city && profile1.city === profile2.city) {
        return 0.7;
      }
      return 0.3;
    }

    const [lon1, lat1] = profile1.location.coordinates;
    const [lon2, lat2] = profile2.location.coordinates;

    // Calculate distance in km
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);

    // Convert to 0-1 scale (closer = higher score)
    // Within 1km = 1.0, 50km+ = 0.1
    if (distance <= 1) return 1.0;
    if (distance <= 5) return 0.9;
    if (distance <= 10) return 0.8;
    if (distance <= 20) return 0.6;
    if (distance <= 50) return 0.3;
    return 0.1;
  }

  // Calculate interaction history (likes, messages, etc.)
  private static async calculateInteractionHistory(user1Id: string, user2Id: string): Promise<number> {
    // Check for existing interactions
    const { data: existingMatch } = await supabase
      .from('vibe_matches')
      .select('*')
      .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
      .single();

    // If they've matched before, lower the score
    if (existingMatch) {
      return existingMatch.chat_started ? 0.2 : 0.4;
    }

    // Check for vibe likes between users
    const { data: likes } = await supabase
      .from('vibe_likes')
      .select('id')
      .in('vibe_echo_id', 
        supabase.from('vibe_echoes').select('id').eq('user_id', user2Id)
      )
      .eq('user_id', user1Id);

    const likeScore = likes && likes.length > 0 ? 0.8 : 0.5;
    return likeScore;
  }

  // Calculate content similarity using simple text analysis
  private static calculateContentSimilarity(
    vibes1: VibeEcho[], 
    vibes2: VibeEcho[],
    profile1: UserProfile,
    profile2: UserProfile
  ): number {
    // Combine content from vibes and bios
    const text1 = [
      ...vibes1.map(v => v.content),
      profile1.bio || ''
    ].join(' ').toLowerCase();

    const text2 = [
      ...vibes2.map(v => v.content),
      profile2.bio || ''
    ].join(' ').toLowerCase();

    if (!text1 || !text2) return 0.5;

    // Simple word frequency analysis
    const getWordFreq = (text: string) => {
      const words = text.split(/\s+/).filter(w => w.length > 3);
      const freq: Record<string, number> = {};
      words.forEach(word => {
        freq[word] = (freq[word] || 0) + 1;
      });
      return freq;
    };

    const freq1 = getWordFreq(text1);
    const freq2 = getWordFreq(text2);

    // Find common words
    const commonWords = Object.keys(freq1).filter(word => freq2[word]);
    const totalUniqueWords = new Set([...Object.keys(freq1), ...Object.keys(freq2)]).size;

    return totalUniqueWords > 0 ? commonWords.length / totalUniqueWords : 0.5;
  }

  // Helper: Calculate distance between coordinates
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private static toRad(value: number): number {
    return value * Math.PI / 180;
  }

  // Find and create matches for a user
  static async findMatches(userId: string, limit: number = 10): Promise<void> {
    try {
      // Get user's profile
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) return;

      // Get potential matches (nearby users)
      const { data: potentialMatches, error } = await supabase
        .from('profiles')
        .select('user_id')
        .neq('user_id', userId)
        .limit(50); // Check top 50 users

      if (error || !potentialMatches) return;

      // Calculate compatibility for each potential match
      const compatibilities = await Promise.all(
        potentialMatches.map(async (match) => ({
          userId: match.user_id,
          score: await this.calculateCompatibility(userId, match.user_id)
        }))
      );

      // Sort by compatibility score and take top matches
      const topMatches = compatibilities
        .sort((a, b) => b.score - a.score)
        .filter(m => m.score >= 0.6) // Minimum 60% compatibility
        .slice(0, limit);

      // Create match records
      for (const match of topMatches) {
        await supabase
          .from('vibe_matches')
          .upsert({
            user1_id: userId,
            user2_id: match.userId,
            compatibility_score: match.score,
            matched_at: new Date().toISOString()
          }, {
            onConflict: 'user1_id,user2_id'
          });
      }
    } catch (error) {
      console.error('Error finding matches:', error);
    }
  }
}