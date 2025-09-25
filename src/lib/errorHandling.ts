// src/lib/errorHandling.ts
import { PostgrestError } from '@supabase/supabase-js';

export class DatabaseError extends Error {
  public code?: string;
  public details?: string;
  public hint?: string;

  constructor(error: PostgrestError) {
    super(error.message);
    this.name = 'DatabaseError';
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
  }
}

export const handleSupabaseError = (error: PostgrestError | null, context: string = 'Database operation') => {
  if (!error) return null;

  console.error(`${context} failed:`, error);

  // Map common errors to user-friendly messages
  const errorMappings: Record<string, string> = {
    '23505': 'This item already exists. Please try a different value.',
    '23503': 'Referenced item not found. Please refresh and try again.',
    '42501': 'You do not have permission to perform this action.',
    'PGRST116': 'No data found matching your request.',
    'PGRST301': 'Request timeout. Please try again.',
  };

  const userMessage = errorMappings[error.code || ''] || 
    error.message || 
    'An unexpected error occurred. Please try again.';

  return new DatabaseError({
    ...error,
    message: userMessage
  });
};

// Retry wrapper for database operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries) break;
      
      // Don't retry on authentication or permission errors
      if (error instanceof DatabaseError && 
          (error.code === '42501' || error.message.includes('JWT'))) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }

  throw lastError!;
};

// Safe database query wrapper
export const safeQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  context: string = 'Query'
): Promise<T> => {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      throw handleSupabaseError(error, context);
    }
    
    if (!data) {
      throw new Error(`${context}: No data returned`);
    }
    
    return data;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new Error(`${context} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Loading state manager
export class LoadingManager {
  private loadingStates = new Map<string, boolean>();
  private subscribers = new Set<(states: Map<string, boolean>) => void>();

  setLoading(key: string, loading: boolean) {
    this.loadingStates.set(key, loading);
    this.notifySubscribers();
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  subscribe(callback: (states: Map<string, boolean>) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.loadingStates));
  }
}

export const loadingManager = new LoadingManager();