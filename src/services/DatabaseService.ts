// src/services/DatabaseService.ts - Centralized database operations
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  current_mood?: string;
  mood_message?: string;
  is_online: boolean;
  is_verified: boolean;
  reputation_score: number;
  is_visible: boolean;
  last_active: string;
  created_at: string;
  updated_at: string;
  privacy_settings?: any;
  security_settings?: any;
  geo_point?: any;
}

export interface Chat {
  id: string;
  match_id?: string;
  user1_id?: string;
  user2_id?: string;
  participants: string[];
  chat_type: 'direct' | 'group';
  chat_name?: string;
  chat_description?: string;
  last_message?: string;
  last_message_at: string;
  is_active: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  chat_room_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file';
  media_url?: string;
  is_read: boolean;
  read_by?: any;
  created_at: string;
}

export interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  updated_at: string;
}

class DatabaseService {
  // =============================================
  // USER PROFILE OPERATIONS
  // =============================================
  
  async getCurrentUserProfile(): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching current user profile:', error);
      return null;
    }
  }

  async getProfileByUserId(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }

  async updateUserLocation(lat: number, lng: number, locationName?: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('update_user_location', {
        new_lat: lat,
        new_lng: lng,
        location_name: locationName || 'Current Location'
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      return false;
    }
  }

  async setUserOnlineStatus(isOnline: boolean): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_active: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating online status:', error);
      return false;
    }
  }

  // =============================================
  // MAP & LOCATION OPERATIONS
  // =============================================

  async getNearbyUsers(lat: number, lng: number, radiusKm: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_nearby_users', {
        user_lat: lat,
        user_lng: lng,
        radius_km: radiusKm
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      return [];
    }
  }

  // =============================================
  // CONNECTIONS & FRIEND REQUESTS
  // =============================================

  async sendFriendRequest(targetUserId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('send_friend_request', {
        target_user_id: targetUserId
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  async respondToFriendRequest(connectionId: string, response: 'accepted' | 'rejected' | 'blocked'): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('respond_to_friend_request', {
        connection_id: connectionId,
        response: response
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error responding to friend request:', error);
      return false;
    }
  }

  async getUserConnections(userId?: string): Promise<Connection[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          requester:profiles!connections_requester_id_fkey(username, full_name, avatar_url),
          addressee:profiles!connections_addressee_id_fkey(username, full_name, avatar_url)
        `)
        .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching connections:', error);
      return [];
    }
  }

  // =============================================
  // CHAT & MESSAGING OPERATIONS
  // =============================================

  async getUserChats(): Promise<Chat[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .contains('participants', [user.id])
        .eq('is_active', true)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching chats:', error);
      return [];
    }
  }

  async createChat(participants: string[], chatType: 'direct' | 'group'): Promise<Chat | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Ensure current user is in participants
      if (!participants.includes(user.id)) {
        participants = [...participants, user.id];
      }

      // For direct chats, sort participants to check for duplicates
      let existingChat = null;
      if (chatType === 'direct') {
        const sortedParticipants = [...participants].sort();
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .eq('chat_type', 'direct')
          .contains('participants', sortedParticipants)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        existingChat = data;
      }

      if (existingChat) return existingChat;

      const insertData: Partial<Chat> = {
        participants,
        chat_type: chatType,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      if (chatType === 'direct' && participants.length === 2) {
        insertData.user1_id = participants[0];
        insertData.user2_id = participants[1];
      }

      const { data, error } = await supabase
        .from('chats')
        .insert(insertData)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  }

  async getChatById(chatId: string): Promise<Chat | null> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching chat:', error);
      return null;
    }
  }

  async getMessagesForChat(chatId: string, limit: number = 50): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_room_id', chatId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data?.reverse() || []; // Reverse to get oldest first
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async sendMessage(chatId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text', mediaUrl?: string): Promise<Message | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const insertData: Partial<Message> = {
        chat_room_id: chatId,
        user_id: user.id,
        content,
        message_type: messageType,
        media_url: mediaUrl,
        is_read: false,
        read_by: [],
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(insertData)
        .select('*')
        .single();

      if (error) throw error;

      // Update chat's last message
      await supabase
        .from('chats')
        .update({
          last_message: content,
          last_message_at: insertData.created_at,
        })
        .eq('id', chatId);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('messages')
        .select('read_by')
        .eq('id', messageId)
        .single();

      if (error) throw error;

      const updatedReadBy = [...(data?.read_by || []), user.id];

      const { error: updateError } = await supabase
        .from('messages')
        .update({
          is_read: true,
          read_by: updatedReadBy,
        })
        .eq('id', messageId);

      if (updateError) throw updateError;
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  // =============================================
  // NOTIFICATION OPERATIONS
  // =============================================

  async getUserNotifications(limit: number = 20): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // =============================================
  // VIBE ECHO (POST) OPERATIONS
  // =============================================

  async createVibeEcho(content: string, mood: string, mediaUrl?: string, mediaType?: string, location?: any): Promise<any | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const insertData = {
        user_id: user.id,
        content,
        mood,
        media_url: mediaUrl,
        media_type: mediaType || 'text',
        location,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('vibe_echoes')
        .insert(insertData)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating vibe echo:', error);
      return null;
    }
  }

  async getNearbyVibeEchoes(lat: number, lng: number, radiusKm: number = 10): Promise<any[]> {
    try {
      // Assuming there's an RPC for this, similar to get_nearby_users
      const { data, error } = await supabase.rpc('get_nearby_vibe_echoes', {
        user_lat: lat,
        user_lng: lng,
        radius_km: radiusKm
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching nearby vibe echoes:', error);
      return [];
    }
  }

  async likeVibeEcho(postId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          post_id: postId,
        });

      if (error) throw error;

      // Update likes count
      await supabase.rpc('increment_likes', { post_id: postId });

      return true;
    } catch (error) {
      console.error('Error liking post:', error);
      return false;
    }
  }

  // =============================================
  // COMMUNITY OPERATIONS
  // =============================================

  async createCommunity(name: string, description: string, category: string, locationBased: boolean = false, location?: any): Promise<any | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const insertData = {
        name,
        description,
        creator_id: user.id,
        category,
        location_based: locationBased,
        location,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('communities')
        .insert(insertData)
        .select('*')
        .single();

      if (error) throw error;

      // Join creator as member
      await this.joinCommunity(data.id);

      return data;
    } catch (error) {
      console.error('Error creating community:', error);
      return null;
    }
  }

  async joinCommunity(communityId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('community_memberships')
        .insert({
          user_id: user.id,
          community_id: communityId,
          role: 'member',
        });

      if (error) throw error;

      // Update member count
      await supabase.rpc('increment_member_count', { comm_id: communityId });

      return true;
    } catch (error) {
      console.error('Error joining community:', error);
      return false;
    }
  }

  async getUserCommunities(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('community_memberships')
        .select(`
          *,
          community:communities(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map((m: any) => m.community) || [];
    } catch (error) {
      console.error('Error fetching user communities:', error);
      return [];
    }
  }

  // =============================================
  // OTHER OPERATIONS
  // =============================================

  async followUser(targetUserId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  }

  async getUserFollowers(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  }
}

export const databaseService = new DatabaseService();