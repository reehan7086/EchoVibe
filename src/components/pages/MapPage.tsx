// src/components/pages/MapPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../lib/supabase";

// Profile type
interface Profile {
  id: string;
  full_name: string;
  city?: string;
  mood?: string;
  avatar_url?: string;
  location?: { lat: number; lng: number };
}

// Connection type
interface Connection {
  id: string;
  user1_id: string;
  user2_id: string;
  status: "pending" | "connected";
}

// DbMessage type for Supabase messages
interface DbMessage {
  id?: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at?: string;
}

// Default avatar
const defaultAvatar = "/default-avatar.png";

// Leaflet icon
const createIcon = (avatarUrl?: string) =>
  L.icon({
    iconUrl: avatarUrl || defaultAvatar,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });

// Haversine distance calculation
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const MapPage: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number]>([25.276987, 55.296249]); // Dubai default
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [chatPartner, setChatPartner] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<{ senderId: string; text: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  // Compute unique moods
  const uniqueMoods = useMemo(() => {
    const moods = new Set(profiles.map(p => p.mood).filter(Boolean));
    return Array.from(moods);
  }, [profiles]);

  // Filtered profiles (nearby and mood)
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      if (!profile.location) return false;
      const dist = calculateDistance(userLocation[0], userLocation[1], profile.location.lat, profile.location.lng);
      const isNearby = dist < 10; // 10km radius
      const moodMatch = !selectedMood || profile.mood === selectedMood;
      return isNearby && moodMatch;
    });
  }, [profiles, userLocation, selectedMood]);

  // Connected profiles
  const connectedProfiles = useMemo(() => {
    return connections
      .filter(c => c.status === "connected")
      .map(c => {
        const otherId = c.user1_id === currentUserId ? c.user2_id : c.user1_id;
        return profiles.find(p => p.id === otherId);
      })
      .filter((p): p is Profile => !!p);
  }, [connections, profiles, currentUserId]);

  // Fetch nearby profiles (all for now, filter client-side)
  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      setProfiles((data || []) as Profile[]);
    } catch (err) {
      console.error("Error fetching profiles:", err);
    }
  };

  // Get user location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.error("Geolocation error:", err)
      );
    }
  };

  // Fetch connections for current user
  const fetchConnections = async (userId: string) => {
    const { data, error } = await supabase
      .from("connections")
      .select("*")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    if (error) console.error(error);
    else setConnections(data || []);
  };

  // Handle connecting to a user
  const handleConnect = async (profile: Profile) => {
    if (!currentUserId) return alert("User not logged in");
    const confirmed = window.confirm(`Connect with ${profile.full_name}?`);
    if (!confirmed) return;

    try {
      // Check for existing connection
      const { data: existing } = await supabase
        .from("connections")
        .select("*")
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${currentUserId})`);
      if (existing && existing.length > 0) return alert("Connection already exists");

      await supabase.from("connections").insert({
        user1_id: currentUserId,
        user2_id: profile.id,
        status: "pending",
      });

      alert(`Connection request sent to ${profile.full_name}`);
      fetchConnections(currentUserId);
    } catch (err) {
      console.error("Error connecting:", err);
    }
  };

  // Share profile on X
  const shareProfile = (profile: Profile) => {
    const text = `Check out ${profile.full_name} on EchoVibe! Mood: ${profile.mood || "unknown"} #EchoVibe`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Open chat with a connected user
  const openChat = async (profile: Profile) => {
    if (!currentUserId) return;
    setChatPartner(profile);
  };

  // Chat subscription and messages fetch
  useEffect(() => {
    if (!chatPartner || !currentUserId) return;

    const fetchMessages = async () => {
      const { data: msgs, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${chatPartner.id}),and(sender_id.eq.${chatPartner.id},receiver_id.eq.${currentUserId})`
        )
        .order("created_at", { ascending: true });
      if (error) console.error(error);
      else setMessages((msgs || []).map((m: DbMessage) => ({ senderId: m.sender_id, text: m.text })));
    };

    fetchMessages();

    const ids = [currentUserId, chatPartner.id].sort();
    const channelName = `chat-${ids.join("-")}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=in.(${ids}),receiver_id=in.(${ids})`,
        },
        (payload) => {
          const newMsg = payload.new as DbMessage;
          setMessages((prev) => [...prev, { senderId: newMsg.sender_id, text: newMsg.text }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatPartner, currentUserId]);

  // Send message
  const sendMessage = async () => {
    if (!chatPartner || !newMessage.trim() || !currentUserId) return;
    try {
      await supabase.from("messages").insert({
        sender_id: currentUserId,
        receiver_id: chatPartner.id,
        text: newMessage,
      });

      setNewMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        getCurrentLocation();
        await fetchProfiles();

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          await fetchConnections(user.id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return <div className="w-full h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="w-full h-screen flex">
      <div className="w-2/3 h-full relative">
        <MapContainer center={userLocation} zoom={13} style={{ width: "100%", height: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Current user */}
          <Marker
            position={userLocation}
            icon={L.icon({ iconUrl: "/current-user.png", iconSize: [60, 60], iconAnchor: [30, 30] })}
          >
            <Popup>You are here</Popup>
          </Marker>

          {/* Nearby users */}
          {filteredProfiles.map((profile) => (
            <Marker
              key={profile.id}
              position={[profile.location!.lat, profile.location!.lng]}
              icon={createIcon(profile.avatar_url)}
              eventHandlers={{ click: () => handleConnect(profile) }}
            >
              <Popup>
                <div className="flex flex-col items-center">
                  <img
                    src={profile.avatar_url || defaultAvatar}
                    alt={profile.full_name}
                    className="w-16 h-16 rounded-full mb-2"
                  />
                  <p>{profile.full_name}</p>
                  {profile.city && <p>{profile.city}</p>}
                  <p>Mood: {profile.mood || "unknown"}</p>
                  <button
                    onClick={() => shareProfile(profile)}
                    className="mt-2 bg-blue-500 text-white p-1 rounded"
                  >
                    Share on X
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Mood filter */}
        <div className="absolute top-4 left-4 bg-white p-2 rounded shadow">
          <select
            value={selectedMood || ""}
            onChange={(e) => setSelectedMood(e.target.value || null)}
            className="border p-1"
          >
            <option value="">All Moods</option>
            {uniqueMoods.map((mood) => (
              <option key={mood} value={mood}>
                {mood}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sidebar: Connections or Chat */}
      <div className="w-1/3 h-full border-l border-gray-300 flex flex-col p-2">
        {chatPartner ? (
          <>
            <h2 className="font-bold text-lg mb-2">{chatPartner.full_name}</h2>
            <div className="flex-1 overflow-y-auto border p-2 mb-2">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-2 p-2 rounded ${
                    msg.senderId === chatPartner.id ? "bg-gray-200 text-left" : "bg-blue-200 text-right"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 border rounded p-1"
                placeholder="Type a message..."
              />
              <button onClick={sendMessage} className="bg-blue-500 text-white p-1 rounded">
                Send
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-bold text-lg mb-2">Connections</h2>
            <ul className="flex-1 overflow-y-auto">
              {connectedProfiles.map((profile) => (
                <li
                  key={profile.id}
                  onClick={() => openChat(profile)}
                  className="cursor-pointer p-2 hover:bg-gray-100"
                >
                  {profile.full_name} - Mood: {profile.mood || "unknown"}
                </li>
              ))}
              {connectedProfiles.length === 0 && <p>No connections yet.</p>}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default MapPage;