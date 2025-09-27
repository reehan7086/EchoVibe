// src/utils/index.ts - Simplified utilities
import { supabase } from '../lib/supabase';

// Date formatting utility
export const formatDate = (date: string) => {
  try {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = (now.getTime() - postDate.getTime()) / (1000 * 3600);

    if (diffInHours < 1) return `${Math.floor(diffInHours * 60)}m`;
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`;
    return postDate.toLocaleDateString();
  } catch (error) {
    return 'Just now';
  }
};

// Get current user utility with proper error handling
export const getCurrentUser = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      return null;
    }
    
    return session?.user || null;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Generate random username
export const generateUsername = (email?: string): string => {
  const adjectives = ['Cool', 'Smart', 'Happy', 'Bright', 'Swift', 'Bold'];
  const nouns = ['User', 'Person', 'Friend', 'Buddy', 'Star', 'Hero'];
  
  if (email) {
    const emailPrefix = email.split('@')[0];
    if (emailPrefix.length >= 3) {
      return emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
  }
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  return `${adjective}${noun}${number}`.toLowerCase();
};

// Debounce function for search
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};