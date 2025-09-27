// src/components/map/SecureVibeMap.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";
import { MessageCircle, UserPlus, X, Shield, AlertTriangle, RefreshCw } from "lucide-react";

interface SecureProfile {
  user_id: string;
  username: string;
  full_name: string;
  gender: "male" | "female" | "other";
  age?: number;
  bio?: string;
  avatar_url?: string;
  current_mood?: string;
  mood_message?: string;
  is_online: boolean;
  is_verified: boolean;
  reputation_score: number;
  is_visible: boolean;
  last_active: string;
  location: { lat: number; lng: number };
  distance_km: number;
  privacy_settings: {
    profile_visibility: string;
    show_age: boolean;
    show_real_name: boolean;
    allow_messages: "everyone" | "connections" | "none";
    allow_friend_requests: boolean;
    location_precision: string;
    show_online_status: boolean;
    show_last_seen: boolean;
    auto_decline_after: number;
  };
  security_settings: {
    block_unverified: boolean;
    min_reputation: number;
    auto_hide_reported: boolean;
    safe_mode: boolean;
  };
}

const REPORT_REASONS = [
  "Inappropriate behavior",
  "Harassment",
  "Fake profile",
  "Spam",
  "Other",
];

// --- Gender marker icon ---
const createGenderMarker = (profile: SecureProfile, inRange: boolean) => {
  const genderColor =
    profile.gender === "female"
      ? "#EC4899"
      : profile.gender === "male"
      ? "#3B82F6"
      : "#8B5CF6";
  const genderSymbol =
    profile.gender === "female"
      ? "♀"
      : profile.gender === "male"
      ? "♂"
      : "◆";

  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden"
          style="border-color: ${genderColor}">
          ${
            profile.avatar_url
              ? `<img src="${profile.avatar_url}" class="w-full h-full object-cover"/>`
              : `<div class="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                 style="background:${genderColor}">${genderSymbol}</div>`
          }
        </div>
        ${
          inRange
            ? `<div class="absolute inset-0 rounded-full border-2 animate-ping" style="border-color:${genderColor}"></div>`
            : ""
        }
      </div>
    `,
    className: "vibe-marker",
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  });
};

// --- Current user marker ---
const currentUserIcon = L.divIcon({
  html: `
    <div class="relative">
      <div class="w-16 h-16 rounded-full border-4 border-green-500 bg-gradient-to-r from-green-400 to-emerald-500 shadow-xl flex items-center justify-center">
        <div class="w-4 h-4 bg-white rounded-full animate-pulse"></div>
      </div>
    </div>
  `,
  className: "current-user-marker",
  iconSize: [64, 64],
  iconAnchor: [32, 32],
});

const SecureVibeMap: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number]>([
    25.276987, 55.296249,
  ]);
  const [profiles, setProfiles] = useState<SecureProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<SecureProfile | null>(null);
  const [interactionRadius, setInteractionRadius] = useState(5);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [reportModal, setReportModal] = useState<{
    user: SecureProfile;
    isOpen: boolean;
  } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const mapRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  // --- Init user ---
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
        requestLocationPermission();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // --- Fetch nearby users ---
  const fetchNearbyUsers = async () => {
    if (!currentUserId) return;
    try {
      const { data, error } = await supabase.rpc("get_nearby_users", {
        user_lat: userLocation[0],
        user_lng: userLocation[1],
        radius_km: 10,
      });
      if (error) throw error;
      const profilesData: SecureProfile[] = (data || []).map((u: any) => ({
        user_id: u.user_id,
        username: u.username,
        full_name: u.full_name,
        gender: u.gender || "other",
        age: u.age,
        bio: u.bio,
        avatar_url: u.avatar_url,
        current_mood: u.current_mood,
        mood_message: u.mood_message || "😊",
        is_online: u.is_online,
        is_verified: u.is_verified,
        reputation_score: u.reputation_score,
        is_visible: true,
        last_active: u.last_active,
        location: { lat: u.lat, lng: u.lng },
        distance_km: u.distance_km,
        privacy_settings: u.privacy_settings,
        security_settings: u.security_settings,
      }));
      setProfiles(profilesData);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Location tracking ---
  useEffect(() => {
    if (!navigator.geolocation || !currentUserId) return;
    const watcher = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        await supabase.rpc("update_user_location", {
          new_lat: latitude,
          new_lng: longitude,
          location_name: "Current Location",
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, [currentUserId]);

  // --- Filter profiles in range ---
  const profilesInRange = useMemo(
    () => profiles.filter((p) => p.distance_km <= interactionRadius),
    [profiles, interactionRadius]
  );

  const handleUserClick = (profile: SecureProfile) => {
    if (profile.distance_km <= interactionRadius) setSelectedUser(profile);
  };

  const handleSendFriendRequest = async (target: SecureProfile) => {
    if (!target.privacy_settings.allow_friend_requests) {
      return alert("Cannot send friend request");
    }
    try {
      const { error } = await supabase.rpc("send_friend_request", {
        target_user_id: target.user_id,
      });
      if (error) throw error;
      alert(`Friend request sent to ${target.username}`);
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      alert("Failed to send friend request");
    }
  };

  const handleStartChat = async (target: SecureProfile) => {
    if (target.privacy_settings.allow_messages === "none") return alert("Cannot message");
    try {
      const { data: existingChat, error: chatError } = await supabase
        .from("chats")
        .select("id")
        .contains("participants", [currentUserId, target.user_id])
        .single();
      if (chatError && chatError.code !== "PGRST116") throw chatError;
      if (existingChat) window.location.href = `/chat/${existingChat.id}`;
      else {
        const { data: newChat, error } = await supabase
          .from("chats")
          .insert({
            participants: [currentUserId, target.user_id],
            chat_type: "direct",
            user1_id: currentUserId,
            user2_id: target.user_id,
          })
          .select("id")
          .single();
        if (error) throw error;
        window.location.href = `/chat/${newChat.id}`;
      }
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      alert("Failed to start chat");
    }
  };

  const handleReportUser = async () => {
    if (!reportModal || !reportReason) return;
    try {
      const finalReason = reportReason === "Other" ? customReason : reportReason;
      const { error } = await supabase.from("user_reports").insert({
        reporter_id: currentUserId,
        reported_id: reportModal.user.user_id,
        reason: finalReason,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      alert(`Reported ${reportModal.user.username} successfully.`);
      setReportModal(null);
      setReportReason("");
      setCustomReason("");
    } catch (err) {
      console.error(err);
      alert("Failed to report user.");
    }
  };

  const requestLocationPermission = async () => {
    if (!navigator.permissions) return;
    try {
      const status = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });
      status.onchange = () => {};
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading Map...</div>;

  return (
    <div className="w-full h-full relative">
      <MapContainer center={userLocation} zoom={13} style={{ width: "100%", height: "100%" }} ref={mapRef}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={userLocation} icon={currentUserIcon}>
          <Popup>
            <div className="font-bold">You are here</div>
            <div>Online Status: <span className="text-green-500">●</span></div>
          </Popup>
        </Marker>

        {profilesInRange.map((profile) => (
          <Marker
            key={profile.user_id}
            position={[profile.location.lat, profile.location.lng]}
            icon={createGenderMarker(profile, true)}
            eventHandlers={{ click: () => handleUserClick(profile) }}
          >
            <Popup>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <img src={profile.avatar_url} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <div className="font-bold">{profile.username}</div>
                    <div className="text-sm text-gray-600">{profile.bio || "No bio"}</div>
                  </div>
                </div>
                <div>Mood: {profile.mood_message || profile.current_mood || "😊"}</div>
                <div>Distance: {profile.distance_km.toFixed(2)} km</div>
                <div>Reputation: {profile.reputation_score}</div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleSendFriendRequest(profile)} className="btn btn-primary flex items-center gap-1">
                    <UserPlus size={16} /> Friend
                  </button>
                  <button onClick={() => handleStartChat(profile)} className="btn btn-success flex items-center gap-1">
                    <MessageCircle size={16} /> Chat
                  </button>
                  <button onClick={() => setReportModal({ user: profile, isOpen: true })} className="btn btn-error flex items-center gap-1">
                    <AlertTriangle size={16} /> Report
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-40">
        <button className="btn btn-secondary flex items-center gap-1" onClick={fetchNearbyUsers}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Report Modal */}
      {reportModal?.isOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 relative">
            <X size={24} className="absolute top-2 right-2 cursor-pointer" onClick={() => setReportModal(null)} />
            <h2 className="font-bold text-xl mb-4">Report {reportModal.user.username}</h2>
            <div className="flex flex-col gap-2">
              {REPORT_REASONS.map((reason) => (
                <label key={reason}>
                  <input type="radio" name="reportReason" value={reason} checked={reportReason === reason} onChange={(e) => setReportReason(e.target.value)} /> {reason}
                </label>
              ))}
              {reportReason === "Other" && (
                <input type="text" placeholder="Enter reason" value={customReason} onChange={(e) => setCustomReason(e.target.value)} className="border p-1 mt-1" />
              )}
            </div>
            <button className="btn btn-error mt-4" onClick={handleReportUser}>Submit Report</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecureVibeMap;
