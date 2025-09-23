// src/services/matchingService.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/integrations/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']
type VibeMatch = Database['public']['Tables']['vibe_matches']['Row']
type VibeEcho = Database['public']['Tables']['vibe_echoes']['Row']

interface MatchingCriteria {
  maxDistance?: number
  minCompatibilityScore?: number
  preferredMoods?: string[]
  preferredActivities?: string[]
  ageRange?: { min: number; max: number }
}

interface MatchResult {
  userId: string
  compatibilityScore: number
  matchingReasons: {
    distanceMatch: boolean
    moodMatch: boolean
    activityMatch: boolean
    commonMoods: string[]
    commonActivities: string[]
  }
  profile: Profile
}

class MatchingService {
  private readonly MOOD_WEIGHTS = {
    'happy': { compatible: ['excited', 'social', 'energetic'], weight: 0.8 },
    'excited': { compatible: ['happy', 'adventurous', 'energetic'], weight: 0.9 },
    'calm': { compatible: ['thoughtful', 'creative'], weight: 0.7 },
    'adventurous': { compatible: ['excited', 'energetic', 'social'], weight: 0.85 },
    'creative': { compatible: ['thoughtful', 'calm', 'happy'], weight: 0.75 },
    'social': { compatible: ['happy', 'excited', 'adventurous'], weight: 0.8 },
    'thoughtful': { compatible: ['calm', 'creative'], weight: 0.7 },
    'energetic': { compatible: ['excited', 'adventurous', 'happy'], weight: 0.9 }
  }

  private readonly ACTIVITY_WEIGHTS = {
    'Coffee': { compatible: ['Food', 'Reading', 'Studying'], weight: 0.7 },
    'Food': { compatible: ['Coffee', 'Social'], weight: 0.8 },
    'Movies': { compatible: ['Music', 'Art'], weight: 0.6 },
    'Music': { compatible: ['Dancing', 'Art', 'Movies'], weight: 0.8 },
    'Art': { compatible: ['Music', 'Photography', 'Creative'], weight: 0.7 },
    'Sports': { compatible: ['Fitness', 'Adventure', 'Nature'], weight: 0.9 },
    'Reading': { compatible: ['Coffee', 'Learning', 'Quiet'], weight: 0.6 },
    'Gaming': { compatible: ['Tech', 'Social'], weight: 0.7 },
    'Travel': { compatible: ['Adventure', 'Photography', 'Nature'], weight: 0.8 },
    'Nature': { compatible: ['Travel', 'Photography', 'Sports'], weight: 0.8 },
    'Photography': { compatible: ['Art', 'Travel', 'Nature'], weight: 0.7 },
    'Dancing': { compatible: ['Music', 'Social', 'Fitness'], weight: 0.8 },
    'Studying': { compatible: ['Coffee', 'Reading', 'Learning'], weight: 0.5 }
  }

  // Find potential matches using AI algorithm
  async findPotentialMatches(userId: string, limit: number = 10): Promise<MatchResult[]> {
    try {
      // Use the SQL function we created
      const { data: matches, error } = await supabase
        .rpc('find_potential_matches', { 
          target_user_id: userId, 
          limit_count: limit 
        })

      if (error) throw error

      // Get full profile data for matches
      const userIds = matches.map((m: any) => m.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds)

      return matches.map((match: any) => ({
        userId: match.user_id,
        compatibilityScore: match.compatibility_score,
        matchingReasons: match.matching_reasons,
        profile: profiles?.find(p => p.user_id === match.user_id)
      })).filter((result: any) => result.profile)

    } catch (error) {
      console.error('Error finding matches:', error)
      return []
    }
  }

  // Enhanced local matching algorithm for real-time suggestions
  async findLocalMatches(userId: string, criteria: MatchingCriteria = {}): Promise<MatchResult[]> {
    try {
      // Get user's profile and preferences
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      const { data: userPrefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!userProfile || !userPrefs) return []

      // Get recent vibe echoes from user to understand current mood
      const { data: recentVibes } = await supabase
        .from('vibe_echoes')
        .select('mood, activity')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5)

      const currentMoods = recentVibes?.map(v => v.mood) || []
      const currentActivities = recentVibes?.map(v => v.activity).filter(Boolean) || []

      // Get potential candidates
      const { data: candidates } = await supabase
        .from('profiles')
        .select(`
          *,
          user_preferences(*)
        `)
        .neq('user_id', userId)
        .eq('is_online', true)
        .gte('last_active', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      if (!candidates) return []

      // Filter out already matched users
      const { data: existingMatches } = await supabase
        .from('vibe_matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

      const matchedUserIds = new Set([
        ...existingMatches?.map(m => m.user1_id === userId ? m.user2_id : m.user1_id) || []
      ])

      // Score and rank candidates
      const scoredCandidates = candidates
        .filter(candidate => !matchedUserIds.has(candidate.user_id))
        .map(candidate => {
          const score = this.calculateCompatibilityScore(
            { profile: userProfile, preferences: userPrefs, currentMoods, currentActivities },
            { profile: candidate, preferences: candidate.user_preferences }
          )
          
          return {
            userId: candidate.user_id,
            compatibilityScore: score.total,
            matchingReasons: score.reasons,
            profile: candidate
          }
        })
        .filter(result => result.compatibilityScore >= (criteria.minCompatibilityScore || 0.3))
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, criteria.maxDistance || 10)

      return scoredCandidates
    } catch (error) {
      console.error('Error in local matching:', error)
      return []
    }
  }

  // Calculate detailed compatibility score
  private calculateCompatibilityScore(
    user: { 
      profile: any, 
      preferences: any, 
      currentMoods: string[], 
      currentActivities: string[] 
    },
    candidate: { 
      profile: any, 
      preferences: any 
    }
  ) {
    let totalScore = 0
    const reasons: any = {
      distanceMatch: false,
      moodMatch: false,
      activityMatch: false,
      commonMoods: [],
      commonActivities: []
    }

    // 1. Distance scoring (30% weight)
    if (user.profile.location && candidate.profile.location) {
      const distance = this.calculateDistance(
        user.profile.location,
        candidate.profile.location
      )
      const maxDistance = user.preferences.max_distance || 50
      if (distance <= maxDistance) {
        const distanceScore = Math.max(0, (maxDistance - distance) / maxDistance)
        totalScore += distanceScore * 0.3
        reasons.distanceMatch = distance <= maxDistance / 2
      }
    } else {
      totalScore += 0.1 // Small bonus for missing location data
    }

    // 2. Mood compatibility (25% weight)
    const moodScore = this.calculateMoodCompatibility(
      user.currentMoods.concat(user.preferences.preferred_moods || []),
      candidate.preferences.preferred_moods || []
    )
    totalScore += moodScore.score * 0.25
    reasons.moodMatch = moodScore.score > 0.5
    reasons.commonMoods = moodScore.commonMoods

    // 3. Activity compatibility (25% weight)
    const activityScore = this.calculateActivityCompatibility(
      user.currentActivities.concat(user.preferences.preferred_activities || []),
      candidate.preferences.preferred_activities || []
    )
    totalScore += activityScore.score * 0.25
    reasons.activityMatch = activityScore.score > 0.5
    reasons.commonActivities = activityScore.commonActivities

    // 4. Vibe score compatibility (10% weight)
    const vibeScoreDiff = Math.abs(user.profile.vibe_score - candidate.profile.vibe_score)
    const vibeCompatibility = Math.max(0, 1 - vibeScoreDiff / 100)
    totalScore += vibeCompatibility * 0.1

    // 5. Recent activity bonus (10% weight)
    const hoursInactive = (Date.now() - new Date(candidate.profile.last_active).getTime()) / (1000 * 60 * 60)
    const recencyScore = Math.max(0, 1 - hoursInactive / 24)
    totalScore += recencyScore * 0.1

    return {
      total: Math.min(1, totalScore),
      reasons
    }
  }

  private calculateMoodCompatibility(userMoods: string[], candidateMoods: string[]) {
    let score = 0
    const commonMoods: string[] = []

    for (const userMood of userMoods) {
      if (candidateMoods.includes(userMood)) {
        commonMoods.push(userMood)
        score += 1
      } else {
        // Check for compatible moods
        const moodData = this.MOOD_WEIGHTS[userMood as keyof typeof this.MOOD_WEIGHTS]
        if (moodData) {
          for (const candidateMood of candidateMoods) {
            if (moodData.compatible.includes(candidateMood)) {
              score += moodData.weight
              break
            }
          }
        }
      }
    }

    return {
      score: Math.min(1, score / Math.max(userMoods.length, candidateMoods.length, 1)),
      commonMoods
    }
  }

  private calculateActivityCompatibility(userActivities: string[], candidateActivities: string[]) {
    let score = 0
    const commonActivities: string[] = []

    for (const userActivity of userActivities) {
      if (candidateActivities.includes(userActivity)) {
        commonActivities.push(userActivity)
        score += 1
      } else {
        // Check for compatible activities
        const activityData = this.ACTIVITY_WEIGHTS[userActivity as keyof typeof this.ACTIVITY_WEIGHTS]
        if (activityData) {
          for (const candidateActivity of candidateActivities) {
            if (activityData.compatible.includes(candidateActivity)) {
              score += activityData.weight
              break
            }
          }
        }
      }
    }

    return {
      score: Math.min(1, score / Math.max(userActivities.length, candidateActivities.length, 1)),
      commonActivities
    }
  }

  private calculateDistance(location1: any, location2: any): number {
    // Simple distance calculation (in km)
    // In a real app, you'd use PostGIS ST_Distance
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(location2.y - location1.y)
    const dLon = this.toRadians(location2.x - location1.x)
    const lat1 = this.toRadians(location1.y)
    const lat2 = this.toRadians(location2.y)

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  // Create a match between two users
  async createMatch(user1Id: string, user2Id: string, compatibilityScore: number, reasons: any): Promise<string | null> {
    try {
      const { data: match, error } = await supabase
        .from('vibe_matches')
        .insert({
          user1_id: user1Id,
          user2_id: user2Id,
          compatibility_score: compatibilityScore,
          matching_reasons: reasons
        })
        .select()
        .single()

      if (error) throw error

      // Create notifications for both users
      await this.createMatchNotifications(match.id, user1Id, user2Id, compatibilityScore)

      return match.id
    } catch (error) {
      console.error('Error creating match:', error)
      return null
    }
  }

  private async createMatchNotifications(matchId: string, user1Id: string, user2Id: string, score: number) {
    const { data: user1Profile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('user_id', user1Id)
      .single()

    const { data: user2Profile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('user_id', user2Id)
      .single()

    // Notify user1
    await supabase.rpc('create_notification', {
      target_user_id: user1Id,
      notification_type: 'match',
      notification_title: 'New Match! 🎉',
      notification_message: `You matched with ${user2Profile?.full_name || 'someone'} (${Math.round(score * 100)}% compatibility)`,
      notification_data: { match_id: matchId, other_user_id: user2Id }
    })

    // Notify user2
    await supabase.rpc('create_notification', {
      target_user_id: user2Id,
      notification_type: 'match',
      notification_title: 'New Match! 🎉',
      notification_message: `You matched with ${user1Profile?.full_name || 'someone'} (${Math.round(score * 100)}% compatibility)`,
      notification_data: { match_id: matchId, other_user_id: user1Id }
    })
  }

  // Run matching for a user automatically
  async runAutoMatching(userId: string): Promise<void> {
    try {
      const matches = await this.findPotentialMatches(userId, 5)
      
      for (const match of matches) {
        if (match.compatibilityScore > 0.6) {
          await this.createMatch(
            userId,
            match.userId,
            match.compatibilityScore,
            match.matchingReasons
          )
        }
      }
    } catch (error) {
      console.error('Error in auto matching:', error)
    }
  }
}

export const matchingService = new MatchingService()