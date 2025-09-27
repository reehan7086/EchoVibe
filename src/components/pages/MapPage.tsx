// src/components/pages/MapPage.tsx
import React, { useEffect, useState } from "react";
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

// Default avatar
const defaultAvatar = "/default-avatar.png";

// Leaflet icon
const createIcon = (avatarUrl?: string) =>
  L.icon({
    iconUrl: avatarUrl || defaultAvatar,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });

const MapPage: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number]>([25.276987, 55.296249]); // Dubai default
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [chatPartner, setChatPartner] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<{ senderId: string; text: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Fetch nearby profiles
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
    const confirmed = window.confirm(`Connect with ${profile.full_name}?`);
    if (!confirmed) return;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User not logged in");

      await supabase.from("connections").insert({
        user1_id: user.id,
        user2_id: profile.id,
        status: "pending",
      });

      alert(`Connection request sent to ${profile.full_name}`);
      fetchConnections(user.id);
    } catch (err) {
      console.error("Error connecting:", err);
    }
  };

  // Open chat with a connected user
  const openChat = (profile: Profile) => {
    setChatPartner(profile);
  
    const channel = supabase
      .channel(`chat-${[profile.id].sort().join("-")}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload: any) => {
          const newMessage = payload.new as { sender_id: string; receiver_id: string; text: string };
          setMessages((prev) => [
            ...prev,
            { senderId: newMessage.sender_id, text: newMessage.text },
          ]);
        }
      )
      .subscribe();
  };
  

  // Send message
  const sendMessage = async () => {
    if (!chatPartner || !newMessage.trim()) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: chatPartner.id,
        text: newMessage,
      });

      setNewMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getCurrentLocation();
    fetchProfiles();

    // Get current user and fetch connections
    const fetchUserConnections = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) fetchConnections(user.id);
    };
    fetchUserConnections();
  }, []);

  return (
    <div className="w-full h-screen flex">
      <div className="w-2/3 h-full">
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
          {profiles.map((profile) => {
            if (!profile.location) return null;
            return (
              <Marker
                key={profile.id}
                position={[profile.location.lat, profile.location.lng]}
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
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Chat Panel */}
      {chatPartner && (
        <div className="w-1/3 h-full border-l border-gray-300 flex flex-col p-2">
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
        </div>
      )}
    </div>
  );
};

export default MapPage;
