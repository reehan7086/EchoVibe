import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, MessageCircle, UserPlus, Heart, Send, Phone, Video, Users, Bell, Menu, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase'; // Adjust import path as needed
import type { Profile, MapUser, ChatRoom, Message, RealtimePayload } from '../../types';

// Current user context - replace with your auth context
const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setCurrentUser(profile);
      }
      setLoading(false);
    };
    getCurrentUser();
  }, []);

  return { currentUser, loading };
};

// Utility functions
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const getActivityEmoji = (mood: string, activity?: string, gender?: string): string => {
  const moodLower = mood?.toLowerCase() || '';
  const activityLower = activity?.toLowerCase() || '';
  
  if (moodLower.includes('coffee') || activityLower.includes('coffee')) return '☕';
  if (moodLower.includes('beach') || activityLower.includes('beach')) return '🏖️';
  if (moodLower.includes('work') || activityLower.includes('work')) return '💼';
  if (moodLower.includes('food') || activityLower.includes('eat')) return '🍽️';
  if (moodLower.includes('gym') || activityLower.includes('fitness')) return '💪';
  if (moodLower.includes('art') || activityLower.includes('art')) return '🎨';
  if (moodLower.includes('music') || activityLower.includes('music')) return '🎵';
  if (moodLower.includes('shopping') || activityLower.includes('shop')) return '🛍️';
  if (moodLower.includes('study') || activityLower.includes('learn')) return '📚';
  if (moodLower.includes('photo') || activityLower.includes('photo')) return '📸';
  if (moodLower.includes('travel') || activityLower.includes('explore')) return '🧳';
  if (moodLower.includes('game') || activityLower.includes('gaming')) return '🎮';
  
  return gender === 'female' ? '👩' : '👨';
};

const getStatusFromLastActive = (lastActive: string): 'online' | 'away' | 'offline' => {
  const now = new Date();
  const last = new Date(lastActive);
  const diffMinutes = (now.getTime() - last.getTime()) / (1000 * 60);
  
  if (diffMinutes < 5) return 'online';
  if (diffMinutes < 30) return 'away';
  return 'offline';
};

// Database functions
const fetchNearbyUsers = async (userLat: number, userLng: number, radiusKm: number, currentUserId: string): Promise<MapUser[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        full_name,
        username,
        bio,
        avatar_url,
        latitude,
        longitude,
        current_mood,
        mood_message,
        last_active,
        vibe_score,
        privacy_level
      `)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .neq('user_id', currentUserId)
      .eq('privacy_level', 'public');

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return (data || [])
      .map(user => {
        const distance = calculateDistance(userLat, userLng, user.latitude!, user.longitude!);
        return {
          ...user,
          distance,
          status: getStatusFromLastActive(user.last_active || new Date().toISOString()),
          activity: user.current_mood || 'Just vibing',
          location_name: `${distance.toFixed(1)} km away`
        } as MapUser;
      })
      .filter(user => user.distance ?? 0 <= radiusKm)
      .sort((a, b) => a.distance! - b.distance!);
  } catch (error) {
    console.error('Error in fetchNearbyUsers:', error);
    return [];
  }
};

const updateUserLocation = async (userId: string, lat: number, lng: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        latitude: lat,
        longitude: lng,
        last_active: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Location update failed:', error);
    }
  } catch (error) {
    console.error('Error updating location:', error);
  }
};

const createChatRoom = async (user1Id: string, user2Id: string): Promise<ChatRoom | null> => {
  try {
    // Check if chat room already exists
    const { data: existingParticipants } = await supabase
      .from('chat_participants')
      .select('chat_room_id')
      .in('user_id', [user1Id, user2Id]);

    if (existingParticipants && existingParticipants.length >= 2) {
      const chatRoomIds = existingParticipants.map(p => p.chat_room_id);
      const commonRoomId = chatRoomIds.find(id => 
        chatRoomIds.filter(roomId => roomId === id).length >= 2
      );
      
      if (commonRoomId) {
        const { data: room } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('id', commonRoomId)
          .single();
        return room;
      }
    }

    // Check if users are connected (friends)
    const { data: connection } = await supabase
      .from('user_connections')
      .select('status')
      .or(`and(user_id.eq.${user1Id},connected_user_id.eq.${user2Id}),and(user_id.eq.${user2Id},connected_user_id.eq.${user1Id})`)
      .eq('status', 'connected')
      .single();

    const chatStatus = connection ? 'approved' : 'pending';

    // Create new chat room
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .insert({
        name: null,
        is_group: false,
        created_by: user1Id,
        chat_status: chatStatus
      })
      .select()
      .single();

    if (roomError || !room) {
      console.error('Error creating chat room:', roomError);
      return null;
    }

    // Add participants
    const { error: participantsError } = await supabase
      .from('chat_participants')
      .insert([
        { chat_room_id: room.id, user_id: user1Id },
        { chat_room_id: room.id, user_id: user2Id }
      ]);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      return null;
    }

    // If chat requires approval, send notification to the other user
    if (chatStatus === 'pending') {
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('user_id', user1Id)
        .single();

      await supabase
        .from('notifications')
        .insert({
          user_id: user2Id,
          related_user_id: user1Id,
          type: 'chat_request',
          message: `${senderProfile?.full_name || senderProfile?.username || 'Someone'} wants to start a chat with you`,
          read: false
        });
    }

    return room;
  } catch (error) {
    console.error('Error in createChatRoom:', error);
    return null;
  }
};

const sendMessage = async (chatRoomId: string, userId: string, content: string): Promise<Message | null> => {
  try {
    // Check chat room status
    const { data: chatRoom } = await supabase
      .from('chat_rooms')
      .select('chat_status, created_by')
      .eq('id', chatRoomId)
      .single();

    if (!chatRoom) {
      console.error('Chat room not found');
      return null;
    }

    // If chat is pending and user is not the creator, require approval
    const requiresApproval = chatRoom.chat_status === 'pending' && chatRoom.created_by !== userId;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_room_id: chatRoomId,
        user_id: userId,
        content,
        message_type: 'text',
        is_read: false,
        requires_approval: requiresApproval,
        approved: !requiresApproval
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return null;
  }
};

// Map Component
const MapComponent: React.FC<{
  onUserSelect: (user: MapUser) => void;
  radius: number;
  users: MapUser[];
  currentUser: Profile;
}> = ({ onUserSelect, radius, users, currentUser }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const initializeMap = useCallback(() => {
    if (mapRef.current && (window as any).L && !mapInstanceRef.current && currentUser.latitude && currentUser.longitude) {
      const L = (window as any).L;
      
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [currentUser.latitude, currentUser.longitude],
        zoom: radius <= 5 ? 13 : radius <= 20 ? 11 : 9,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // Add radius circle
      radiusCircleRef.current = L.circle([currentUser.latitude, currentUser.longitude], {
        radius: radius * 1000,
        color: '#8b5cf6',
        fillColor: '#8b5cf6',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '10, 5'
      }).addTo(mapInstanceRef.current);

      // Current user marker
      const currentUserIcon = L.divIcon({
        html: `<div class="relative flex items-center justify-center">
                 <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 border-4 border-white rounded-full shadow-xl flex items-center justify-center relative z-10">
                   <span class="text-lg">🧑‍💻</span>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-ping opacity-30"></div>
                 <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                   YOU
                 </div>
               </div>`,
        className: 'current-user-marker',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      L.marker([currentUser.latitude, currentUser.longitude], { icon: currentUserIcon })
        .addTo(mapInstanceRef.current);

      setMapLoaded(true);
    }
  }, [currentUser.latitude, currentUser.longitude, radius]);

  // Update markers when users change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const L = (window as any).L;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    users.forEach((user) => {
      if (!user.latitude || !user.longitude) return;

      const emoji = getActivityEmoji(user.current_mood || '', user.activity, user.gender);
      const pinColor = user.gender === 'female' ? 'from-pink-400 to-pink-600' : 'from-blue-400 to-blue-600';
      const statusColor = user.status === 'online' ? 'bg-green-400' : user.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400';
      
      const profileIcon = L.divIcon({
        html: `<div class="relative flex items-center justify-center">
                 <div class="w-10 h-10 bg-gradient-to-r ${pinColor} rounded-full shadow-lg flex items-center justify-center z-10 border-3 border-white">
                   <span class="text-lg">${emoji}</span>
                 </div>
                 <div class="absolute -top-1 -right-1 w-4 h-4 ${statusColor} border-2 border-white rounded-full z-20"></div>
               </div>`,
        className: `profile-marker profile-${user.id} cursor-pointer`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([user.latitude, user.longitude], { icon: profileIcon })
        .addTo(mapInstanceRef.current);

      marker.on('click', () => {
        onUserSelect(user);
      });

      marker.bindTooltip(`<div class="text-center">
        <div class="font-bold text-sm">${user.full_name || user.username}</div>
        <div class="text-xs text-gray-600">${user.distance?.toFixed(1)} km away</div>
        <div class="text-xs">${user.current_mood || 'Just vibing'}</div>
      </div>`, {
        direction: 'top',
        offset: [0, -25],
      });

      markersRef.current.push(marker);
    });
  }, [users, mapLoaded, onUserSelect]);

  // Load Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
        document.head.appendChild(link);
      }

      if (!(window as any).L) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
        script.onload = initializeMap;
        document.head.appendChild(script);
      } else {
        initializeMap();
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current = [];
    };
  }, [initializeMap]);

  // Update radius circle
  useEffect(() => {
    if (radiusCircleRef.current && currentUser.latitude && currentUser.longitude) {
      radiusCircleRef.current.setRadius(radius * 1000);
    }
  }, [radius, currentUser.latitude, currentUser.longitude]);

  return (
    <div className="relative w-full h-96 bg-gray-700 rounded-lg overflow-hidden">
      <style>{`
        .leaflet-container {
          background: #374151 !important;
          border-radius: 0.5rem;
        }
        .profile-marker {
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
        }
        .current-user-marker {
          filter: drop-shadow(0 6px 12px rgba(139, 92, 246, 0.4));
        }
      `}</style>

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700 z-10">
          <div className="text-white text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading map...</p>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full z-0" />
      
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={() => {
            if (mapInstanceRef.current && currentUser.latitude && currentUser.longitude) {
              mapInstanceRef.current.setView([currentUser.latitude, currentUser.longitude], 12);
            }
          }}
          className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-lg shadow-lg transition-all"
          title="Center on my location"
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// User Profile Card
const UserProfileCard: React.FC<{
  user: MapUser;
  onClose: () => void;
  onMessage: (user: MapUser) => void;
  currentUser: Profile;
}> = ({ user, onClose, onMessage, currentUser }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      // Check if connection already exists
      const { data: existingConnection } = await supabase
        .from('user_connections')
        .select('*')
        .or(`and(user_id.eq.${currentUser.user_id},connected_user_id.eq.${user.user_id}),and(user_id.eq.${user.user_id},connected_user_id.eq.${currentUser.user_id})`)
        .single();

      if (existingConnection) {
        console.log('Connection already exists');
        setIsConnected(true);
        setLoading(false);
        return;
      }

      // Create connection request
      const { error: connectionError } = await supabase
        .from('user_connections')
        .insert({
          user_id: currentUser.user_id,
          connected_user_id: user.user_id,
          status: 'pending'
        });

      if (connectionError) {
        console.error('Error creating connection:', connectionError);
        setLoading(false);
        return;
      }

      // Send notification to the other user
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.user_id,
          related_user_id: currentUser.user_id,
          type: 'connection_request',
          message: `${currentUser.full_name || currentUser.username || 'Someone'} wants to connect with you`,
          read: false
        });

      if (notificationError) {
        console.error('Error sending notification:', notificationError);
      }

      setIsConnected(true);
    } catch (error) {
      console.error('Error connecting:', error);
    }
    setLoading(false);
  };

  const dynamicEmoji = getActivityEmoji(user.current_mood || '', user.activity, user.gender);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full transform transition-all shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl font-bold mb-3 ${
            user.gender === 'female' ? 'bg-gradient-to-r from-pink-400 to-pink-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
          } shadow-lg`}>
            {dynamicEmoji}
          </div>
          <h3 className="text-xl font-bold text-white">{user.full_name || user.username}</h3>
          <p className="text-gray-400">@{user.username}</p>
          <p className="text-purple-400 text-sm">{user.location_name}</p>
          
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs mt-2 ${
            user.status === 'online' ? 'bg-green-600 text-green-100' : 
            user.status === 'away' ? 'bg-yellow-600 text-yellow-100' : 'bg-gray-600 text-gray-100'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              user.status === 'online' ? 'bg-green-300' : 
              user.status === 'away' ? 'bg-yellow-300' : 'bg-gray-300'
            } animate-pulse`}></div>
            {user.status === 'online' ? 'Online' : user.status === 'away' ? 'Away' : 'Offline'}
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Current Mood</p>
            <p className="text-white">{user.current_mood || 'Just vibing'}</p>
          </div>
          {user.bio && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Bio</p>
              <p className="text-white text-sm">{user.bio}</p>
            </div>
          )}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Vibe Score</p>
            <p className="text-yellow-300 text-sm">{user.vibe_score || 50}/100</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onMessage(user)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl transition-all font-medium text-sm flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat</span>
            </button>
            <button 
              onClick={handleConnect}
              disabled={loading}
              className={`${isConnected ? 'bg-green-600 hover:bg-green-700' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'} text-white py-3 px-4 rounded-xl transition-all font-medium text-sm flex items-center justify-center space-x-2`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isConnected ? (
                <Heart className="w-4 h-4 fill-current" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>{isConnected ? 'Connected' : 'Connect'}</span>
            </button>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Main Component
const SparkVibeMap: React.FC = () => {
  const { currentUser, loading: userLoading } = useCurrentUser();
  const [selectedUser, setSelectedUser] = useState<MapUser | null>(null);
  const [currentView, setCurrentView] = useState<'map' | 'messages' | 'notifications' | 'users'>('map');
  const [selectedRadius, setSelectedRadius] = useState<number>(5);
  const [chatUser, setChatUser] = useState<MapUser | null>(null);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<MapUser[]>([]);
  const [loading, setLoading] = useState(false);

  const radiusOptions = [1, 2, 5, 10, 20, 50, 100];

  // Load nearby users
  const loadNearbyUsers = useCallback(async () => {
    if (!currentUser?.latitude || !currentUser?.longitude) return;
    
    setLoading(true);
    try {
      const users = await fetchNearbyUsers(
        currentUser.latitude, 
        currentUser.longitude, 
        selectedRadius, 
        currentUser.user_id
      );
      setNearbyUsers(users);
    } catch (error) {
      console.error('Error loading nearby users:', error);
    }
    setLoading(false);
  }, [currentUser, selectedRadius]);

  // Update location periodically
  useEffect(() => {
    if (!currentUser?.user_id) return;

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await updateUserLocation(
              currentUser.user_id,
              position.coords.latitude,
              position.coords.longitude
            );
          },
          (error) => console.error('Geolocation error:', error)
        );
      }
    };

    updateLocation();
    const interval = setInterval(updateLocation, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [currentUser]);

  // Load users when radius or user changes
  useEffect(() => {
    loadNearbyUsers();
  }, [loadNearbyUsers]);

  // Real-time subscriptions
  useEffect(() => {
    if (!currentUser) return;
  
    // Subscribe to profile updates for nearby users
    const profileSubscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles' 
        },
        async (payload: any) => {
          console.log('Profile change detected:', payload);
          
          // Handle different event types
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedProfile = payload.new as Profile;
            
            // Check if this user should be in our nearby list
            if (currentUser.latitude && currentUser.longitude && updatedProfile.latitude && updatedProfile.longitude) {
              const distance = calculateDistance(
                currentUser.latitude, 
                currentUser.longitude, 
                updatedProfile.latitude, 
                updatedProfile.longitude
              );
              
              if (distance <= selectedRadius && updatedProfile.user_id !== currentUser.user_id) {
                // Add or update user in nearby list
                setNearbyUsers(prev => {
                  const existingIndex = prev.findIndex(user => user.user_id === updatedProfile.user_id);
                  const mapUser: MapUser = {
                    ...updatedProfile,
                    distance,
                    status: getStatusFromLastActive(updatedProfile.last_active || new Date().toISOString()),
                    activity: updatedProfile.current_mood || 'Just vibing',
                    location_name: `${distance.toFixed(1)} km away`
                  };
                  
                  if (existingIndex >= 0) {
                    // Update existing user
                    const updated = [...prev];
                    updated[existingIndex] = mapUser;
                    return updated.sort((a, b) => a.distance! - b.distance!);
                  } else {
                    // Add new user
                    return [...prev, mapUser].sort((a, b) => a.distance! - b.distance!);
                  }
                });
              } else {
                // Remove user if they're now out of range
                setNearbyUsers(prev => prev.filter(user => user.user_id !== updatedProfile.user_id));
              }
            }
          } else if (payload.eventType === 'INSERT' && payload.new) {
            // Handle new user registration
            const newProfile = payload.new as Profile;
            
            if (currentUser.latitude && currentUser.longitude && newProfile.latitude && newProfile.longitude) {
              const distance = calculateDistance(
                currentUser.latitude, 
                currentUser.longitude, 
                newProfile.latitude, 
                newProfile.longitude
              );
              
              if (distance <= selectedRadius && newProfile.user_id !== currentUser.user_id) {
                const mapUser: MapUser = {
                  ...newProfile,
                  distance,
                  status: getStatusFromLastActive(newProfile.last_active || new Date().toISOString()),
                  activity: newProfile.current_mood || 'Just vibing',
                  location_name: `${distance.toFixed(1)} km away`
                };
                
                setNearbyUsers(prev => [...prev, mapUser].sort((a, b) => a.distance! - b.distance!));
              }
            }
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // Remove user from map if they delete their profile
            const deletedProfile = payload.old as Profile;
            setNearbyUsers(prev => prev.filter(user => user.user_id !== deletedProfile.user_id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Profile subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to profile changes');
        }
      });
  
    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [currentUser, selectedRadius]);

  const handleUserSelect = (user: MapUser) => {
    setSelectedUser(user);
  };

  const handleMessage = async (user: MapUser) => {
    if (!currentUser) return;
    
    setSelectedUser(null);
    setChatUser(user);
    setCurrentView('messages');

    // Create or get chat room
    const room = await createChatRoom(currentUser.user_id, user.user_id);
    if (room) {
      setChatRoom(room);
      // Load existing messages
      const { data: existingMessages } = await supabase
        .from('messages')
        .select(`
          *,
          profile:profiles(full_name, username, avatar_url)
        `)
        .eq('chat_room_id', room.id)
        .order('created_at', { ascending: true });
      
      setMessages(existingMessages || []);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !chatRoom || !currentUser) return;

    const newMessage = await sendMessage(chatRoom.id, currentUser.user_id, message.trim());
    if (newMessage) {
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
    }
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'messages':
        return (
          <div className="bg-gray-800 rounded-xl h-full flex flex-col">
            {chatUser ? (
              <>
                <div className="p-4 border-b border-gray-700 flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    chatUser.gender === 'female' ? 'bg-gradient-to-r from-pink-400 to-pink-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
                  }`}>
                    {getActivityEmoji(chatUser.current_mood || '', chatUser.activity, chatUser.gender)}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{chatUser.full_name || chatUser.username}</h3>
                    <p className={`text-xs ${chatUser.status === 'online' ? 'text-green-400' : 'text-gray-400'}`}>
                      {chatUser.status === 'online' ? 'Online' : 'Away'}
                    </p>
                  </div>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.user_id === currentUser?.user_id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          msg.user_id === currentUser?.user_id
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-white'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs text-gray-300 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 border-t border-gray-700">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400">Select a user to start messaging</p>
              </div>
            )}
          </div>
        );
      
      case 'users':
        return (
          <div className="bg-gray-800 rounded-xl p-6 h-full">
            <h2 className="text-xl font-semibold mb-6">All Users</h2>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto">
                {nearbyUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className="bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-all" 
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.gender === 'female' ? 'bg-gradient-to-r from-pink-400 to-pink-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
                      }`}>
                        {getActivityEmoji(user.current_mood || '', user.activity, user.gender)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{user.full_name || user.username}</p>
                        <p className="text-xs text-gray-400">{user.location_name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'notifications':
        return (
          <div className="bg-gray-800 rounded-xl p-6 h-full">
            <h2 className="text-xl font-semibold mb-6">Notifications</h2>
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400">No notifications yet</p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-gray-800 rounded-xl p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Live Map</h2>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">Radius:</span>
                <select 
                  value={selectedRadius}
                  onChange={(e) => setSelectedRadius(Number(e.target.value))}
                  className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {radiusOptions.map(radius => (
                    <option key={radius} value={radius}>{radius} km</option>
                  ))}
                </select>
                <div className="text-sm text-gray-400">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin inline" />
                  ) : (
                    `${nearbyUsers.length} users nearby`
                  )}
                </div>
              </div>
            </div>
            {currentUser?.latitude && currentUser?.longitude ? (
              <MapComponent 
                onUserSelect={handleUserSelect} 
                radius={selectedRadius} 
                users={nearbyUsers}
                currentUser={currentUser}
              />
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-700 rounded-lg">
                <div className="text-center text-white">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">Location access required</p>
                  <button 
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          async (position) => {
                            if (currentUser) {
                              await updateUserLocation(
                                currentUser.user_id,
                                position.coords.latitude,
                                position.coords.longitude
                              );
                              window.location.reload();
                            }
                          }
                        );
                      }
                    }}
                    className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Enable Location
                  </button>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  if (userLoading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl mb-4">Please log in to use SparkVibe Map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-20 bg-gradient-to-b from-purple-800 to-blue-900 flex flex-col">
        <div className="p-4 space-y-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl flex items-center justify-center">
            <Menu className="w-6 h-6 text-white" />
          </div>
          
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {currentUser.full_name?.charAt(0) || currentUser.username?.charAt(0) || 'P'}
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={() => setCurrentView('map')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                currentView === 'map' ? 'bg-purple-700 bg-opacity-50' : 'hover:bg-purple-700 hover:bg-opacity-30'
              }`}
            >
              <MapPin className="w-6 h-6 text-white" />
            </button>
            <button 
              onClick={() => setCurrentView('messages')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                currentView === 'messages' ? 'bg-purple-700 bg-opacity-50' : 'hover:bg-purple-700 hover:bg-opacity-30'
              }`}
            >
              <MessageCircle className="w-6 h-6 text-gray-300" />
            </button>
            <button 
              onClick={() => setCurrentView('notifications')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                currentView === 'notifications' ? 'bg-purple-700 bg-opacity-50' : 'hover:bg-purple-700 hover:bg-opacity-30'
              }`}
            >
              <Bell className="w-6 h-6 text-gray-300" />
            </button>
            <button 
              onClick={() => setCurrentView('users')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                currentView === 'users' ? 'bg-purple-700 bg-opacity-50' : 'hover:bg-purple-700 hover:bg-opacity-30'
              }`}
            >
              <Users className="w-6 h-6 text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">
              {currentView === 'map' && 'Discover Nearby'}
              {currentView === 'messages' && 'Messages'}
              {currentView === 'notifications' && 'Notifications'}
              {currentView === 'users' && 'All Users'}
            </h1>
          </div>
          {currentView === 'map' && (
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{nearbyUsers.length} users nearby</span>
            </div>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            
            {/* Main Content */}
            <div className="lg:col-span-3 h-full">
              {renderMainContent()}
            </div>

            {/* Right Sidebar - Nearby Users */}
            <div className="space-y-6 h-full overflow-hidden">
              <div className="bg-gray-800 rounded-xl p-6 h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-4 text-gray-100 flex-shrink-0">Nearby Users</h3>
                <div className="flex-1 overflow-y-auto pr-2">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {nearbyUsers.map((user) => (
                        <div 
                          key={user.id} 
                          className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-all cursor-pointer border border-gray-600"
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold relative flex-shrink-0 ${
                              user.gender === 'female' 
                                ? 'bg-gradient-to-r from-pink-400 to-pink-600' 
                                : 'bg-gradient-to-r from-blue-400 to-blue-600'
                            } shadow-lg`}>
                              {getActivityEmoji(user.current_mood || '', user.activity, user.gender)}
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-700 ${
                                user.status === 'online' ? 'bg-green-400' : 
                                user.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                              }`}></div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-white text-sm truncate">{user.full_name || user.username}</p>
                                  <p className="text-xs text-gray-400 truncate">{user.location_name}</p>
                                </div>
                                <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{user.distance?.toFixed(1)} km</span>
                              </div>
                              
                              <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${
                                user.status === 'online' 
                                  ? 'bg-green-600 bg-opacity-20 text-green-300' 
                                  : user.status === 'away'
                                  ? 'bg-yellow-600 bg-opacity-20 text-yellow-300'
                                  : 'bg-gray-600 bg-opacity-20 text-gray-300'
                              }`}>
                                {user.status === 'online' ? 'Online' : 
                                 user.status === 'away' ? 'Away' : 'Offline'}
                              </div>
                              
                              <div className="mt-2">
                                <p className="text-xs text-gray-300 italic truncate">"{user.current_mood || 'Just vibing'}"</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      {selectedUser && currentUser && (
        <UserProfileCard 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)}
          onMessage={handleMessage}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default SparkVibeMap;