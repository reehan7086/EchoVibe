// src/components/pages/MapPage.tsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../lib/supabase";
import { VibeEcho, Profile } from "../../types";
import L from "leaflet";

interface MapPageProps {
  currentUserId: string;
}

interface VibeLocation {
  id: string;
  lat: number;
  lng: number;
  mood: string;
  user: Profile;
}

const moodColors: Record<string, string> = {
  happy: "#FFD700",
  sad: "#1E90FF",
  excited: "#FF4500",
  relaxed: "#32CD32",
  angry: "#FF0000",
  default: "#FF69B4",
};

const MapPage: React.FC<MapPageProps> = ({ currentUserId }) => {
  const [vibes, setVibes] = useState<VibeLocation[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true }
    );
  }, []);

  const fetchVibes = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id, mood, location, profiles(*)")
      .eq("is_active", true);

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
        const vibeLocations: VibeLocation[] = data
        .filter((v) => v.location?.lat && v.location?.lng)
        .map((v) => ({
          id: v.id,
          lat: v.location.lat,
          lng: v.location.lng,
          mood: v.mood,
          user: Array.isArray(v.profiles) ? v.profiles[0] : (v.profiles as Profile),
        }));
      
      setVibes(vibeLocations);
    }
  };

  useEffect(() => {
    fetchVibes();
    const interval = setInterval(fetchVibes, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!userLocation) return <div className="text-center mt-10">Loading map...</div>;

  const nearbyVibes = vibes.filter(
    (v) =>
      Math.sqrt(
        Math.pow(userLocation[0] - v.lat, 2) + Math.pow(userLocation[1] - v.lng, 2)
      ) < 0.005
  );
  const nearbyVibesCount = nearbyVibes.length;

  return (
    <div className="w-full h-screen">
      <MapContainer center={userLocation} zoom={14} style={{ width: "100%", height: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User circle with dynamic pulse */}
        <Circle
          center={userLocation}
          radius={30}
          pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.2 }}
          className="user-circle"
        />

        {/* Vibe circles */}
        {vibes.map((vibe) => {
          const color = moodColors[vibe.mood.toLowerCase()] || moodColors.default;
          const distance = Math.sqrt(
            Math.pow(userLocation[0] - vibe.lat, 2) + Math.pow(userLocation[1] - vibe.lng, 2)
          );
          const pulseRadius = Math.min(300, distance * 50000);
          return (
            <Circle
              key={vibe.id}
              center={[vibe.lat, vibe.lng]}
              radius={pulseRadius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.2,
                weight: 2,
              }}
            >
              <Popup>
                <strong>{vibe.user.username}</strong> is feeling <em>{vibe.mood}</em>
              </Popup>
            </Circle>
          );
        })}

        {/* Mood markers */}
        {vibes.map((vibe) => {
          const color = moodColors[vibe.mood.toLowerCase()] || moodColors.default;
          return (
            <Marker
              key={`marker-${vibe.id}`}
              position={[vibe.lat, vibe.lng]}
              icon={L.divIcon({
                className: "vibe-marker",
                html: `<div style="
                  width:20px;
                  height:20px;
                  border-radius:50%;
                  background:${color};
                  animation: pulse 1.5s infinite;
                  border: 2px solid #fff;
                "></div>`,
              })}
            />
          );
        })}

        {/* Animated lines connecting user to nearby vibes */}
        {nearbyVibes.map((vibe) => (
          <Polyline
            key={`line-${vibe.id}`}
            positions={[userLocation, [vibe.lat, vibe.lng]]}
            pathOptions={{
              color: "#00FFFF",
              weight: 2,
              dashArray: "4,8",
              opacity: 0.7,
            }}
            className="pulse-line"
          />
        ))}
      </MapContainer>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.4); opacity: 0.3; }
            100% { transform: scale(1); opacity: 0.7; }
          }

          .user-circle {
            animation: userPulse ${Math.max(1, 3 - nearbyVibesCount * 0.5)}s infinite;
          }

          @keyframes userPulse {
            0% { r: 30; opacity: 0.3; }
            50% { r: 45; opacity: 0.5; }
            100% { r: 30; opacity: 0.3; }
          }

          .pulse-line {
            animation: dashMove 1s linear infinite;
          }

          @keyframes dashMove {
            to {
              stroke-dashoffset: 1000;
            }
          }
        `}
      </style>
    </div>
  );
};

export default MapPage;
