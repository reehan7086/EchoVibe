// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rtrwrjzatvdyclntelca.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0cndyanphdHZkeWNsbnRlbGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NjM2NjMsImV4cCI6MjA3NDAzOTY2M30.r2w14sflhDGf9GGuTqeiLG34bQ0JTpVuLD7i1r-Xlx4'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Helper functions for common operations
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  return data
}

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return data.publicUrl
}

// Real-time helpers
export const subscribeToVibeEchoes = (callback: (payload: any) => void) => {
  return supabase
    .channel('vibe_echoes_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'vibe_echoes' }, 
      callback
    )
    .subscribe()
}

export const subscribeToMessages = (chatId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`messages_${chatId}`)
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, 
      callback
    )
    .subscribe()
}

export const subscribeToMatches = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`matches_${userId}`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'vibe_matches', filter: `user1_id=eq.${userId}` }, 
      callback
    )
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'vibe_matches', filter: `user2_id=eq.${userId}` }, 
      callback
    )
    .subscribe()
}