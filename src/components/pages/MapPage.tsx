// src/components/pages/MapPage.tsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../lib/supabase";
import { Profile } from "../../types";

interface MapPageProps {
  currentUserId: string;
}

// Small vibrating circle icon
const createVibeIcon = (avatarUrl?: string) => {
  return L.divIcon({
    className: "vibe-marker",
    html: `<div class="vibe-circle" style="
        width:40px;
        height:40px;
        border-radius:50%;
        border:3px solid #ff4081;
        background-image: url(${avatarUrl || ""});
        background-size: cover;
        animation: pulse 1.5s infinite alternate;
    "></div>`,
  });
};

// Center map to current user
const MapCenter: React.FC<{ position: LatLngExpression }> = ({ position }) => {
  const map = useMap();
  map.setView(position, 15);
  return null;
};

const MapPage: React.FC<MapPageProps> = ({ currentUserId }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  // Fetch current user
  const fetchCurrentUser = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUserId)
      .single();
    if (error) console.error("Error fetching current user:", error);
    else setCurrentUser(data as Profile);
  };

  // Fetch nearby users
  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .not("id", "eq", currentUserId); // exclude current user
    if (error) console.error("Error fetching profiles:", error);
    else setProfiles(data as Profile[]);
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchProfiles();

    // Realtime subscription for changes in profiles table
    const subscription = supabase
      .channel("public:profiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          console.log("Realtime payload:", payload);
          fetchProfiles(); // refetch whenever a profile changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (!currentUser) return <div className="text-center mt-20">Loading map...</div>;

  const currentPosition: LatLngExpression = [
    currentUser.location?.lat || 25.276987,
    currentUser.location?.lng || 55.296249,
  ];

  return (
    <div className="w-full h-screen">
      <MapContainer
        center={currentPosition}
        zoom={15}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenter position={currentPosition} />

        {profiles.map((profile) => {
          if (!profile.location) return null;
          const position: LatLngExpression = [profile.location.lat, profile.location.lng];
          return (
            <Marker
              key={profile.id}
              position={position}
              icon={createVibeIcon(profile.avatar_url)}
            >
              <Popup>
                <div className="text-center">
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-16 h-16 rounded-full mx-auto"
                  />
                  <p className="font-bold">{profile.username}</p>
                  <p>{profile.mood || "Vibing"}</p>
                  {/* You can add "Connect" button or message option here */}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.3); opacity: 0.7; }
          }
        `}
      </style>
    </div>
  );
};

export default MapPage;
