// src/types.ts

// ------------------
// Auth/User
// ------------------
export interface User {
  id: string;
  email: string | null;
  user_metadata?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
  created_at?: string;
}

// ------------------
// Profile
// ------------------
export interface Profile {
  id: string;
  full_name: string;
  username: string;
  bio?: string;
  website?: string;
  location?: string;
  city?: string;
  avatar_url?: string;
  is_online?: boolean;
  status?: "online" | "offline";
  created_at?: string;
  updated_at?: string;
}

// ------------------
// Connection between users
// ------------------
export interface Connection {
  id: string;
  user1_id: string;
  user2_id: string;
  status: "pending" | "connected";
}

// ------------------
// Messages (for chat)
// ------------------
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at?: string;
}

// ------------------
// Any future types can be added here
// ------------------
