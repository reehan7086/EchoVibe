// AuthService.js - Authentication service with privacy features
class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  }

  // Generate random display names for privacy
  generateRandomDisplayName() {
    const adjectives = [
      'Spark', 'Vibe', 'Echo', 'Pulse', 'Wave', 'Glow', 'Shine', 'Beam',
      'Flow', 'Drift', 'Swift', 'Bold', 'Bright', 'Sharp', 'Cool', 'Warm'
    ];
    
    const nouns = [
      'Walker', 'Runner', 'Dreamer', 'Thinker', 'Builder', 'Creator', 'Explorer',
      'Seeker', 'Finder', 'Keeper', 'Hunter', 'Rider', 'Glider', 'Soarer', 'Diver'
    ];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    
    return `${adjective}${noun}${number}`;
  }

  // Google OAuth Login
  async loginWithGoogle() {
    try {
      // In a real app, this would integrate with Google OAuth
      // For demo purposes, we'll simulate the login
      const mockGoogleUser = {
        id: 'google_' + Date.now(),
        email: 'user@gmail.com', // This won't be shown in the app
        name: 'Google User', // This won't be shown in the app
        provider: 'google',
        avatar: null
      };

      return await this.processLogin(mockGoogleUser);
    } catch (error) {
      console.error('Google login failed:', error);
      throw new Error('Google login failed');
    }
  }

  // Apple OAuth Login
  async loginWithApple() {
    try {
      // In a real app, this would integrate with Apple Sign In
      // For demo purposes, we'll simulate the login
      const mockAppleUser = {
        id: 'apple_' + Date.now(),
        email: 'user@icloud.com', // This won't be shown in the app
        name: 'Apple User', // This won't be shown in the app
        provider: 'apple',
        avatar: null
      };

      return await this.processLogin(mockAppleUser);
    } catch (error) {
      console.error('Apple login failed:', error);
      throw new Error('Apple login failed');
    }
  }

  // Guest Login (no OAuth required)
  async loginAsGuest() {
    try {
      const mockGuestUser = {
        id: 'guest_' + Date.now(),
        email: null,
        name: 'Guest User',
        provider: 'guest',
        avatar: null
      };

      return await this.processLogin(mockGuestUser);
    } catch (error) {
      console.error('Guest login failed:', error);
      throw new Error('Guest login failed');
    }
  }

  // Process login and create privacy-safe user profile
  async processLogin(rawUserData) {
    try {
      // Create privacy-safe user object
      const displayName = this.generateRandomDisplayName();
      const safeUser = {
        id: rawUserData.id,
        displayName: displayName,
        handle: '@' + displayName.toLowerCase(),
        provider: rawUserData.provider,
        avatar: rawUserData.avatar || displayName[0].toUpperCase(),
        isGuest: rawUserData.provider === 'guest',
        createdAt: new Date().toISOString(),
        // Real email/name are NOT stored in the client-side user object for privacy
        preferences: {
          notifications: true,
          darkMode: true,
          privateProfile: false,
          showOnlineStatus: true
        }
      };

      // Store in localStorage (in production, use secure storage)
      localStorage.setItem('sparkvibe_user', JSON.stringify(safeUser));
      localStorage.setItem('sparkvibe_session', JSON.stringify({
        token: 'demo_token_' + Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }));

      this.currentUser = safeUser;
      this.isAuthenticated = true;

      return safeUser;
    } catch (error) {
      console.error('Login processing failed:', error);
      throw new Error('Login processing failed');
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      if (this.currentUser) {
        return this.currentUser;
      }

      const storedUser = localStorage.getItem('sparkvibe_user');
      const storedSession = localStorage.getItem('sparkvibe_session');

      if (storedUser && storedSession) {
        const user = JSON.parse(storedUser);
        const session = JSON.parse(storedSession);

        // Check if session is still valid
        if (session.expiresAt > Date.now()) {
          this.currentUser = user;
          this.isAuthenticated = true;
          return user;
        } else {
          // Session expired, clear storage
          await this.logout();
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      await this.logout(); // Clear corrupted data
      return null;
    }
  }

  // Update user preferences
  async updateUserPreferences(preferences) {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }

      const updatedUser = {
        ...this.currentUser,
        preferences: {
          ...this.currentUser.preferences,
          ...preferences
        }
      };

      localStorage.setItem('sparkvibe_user', JSON.stringify(updatedUser));
      this.currentUser = updatedUser;

      return updatedUser;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      // Clear local storage
      localStorage.removeItem('sparkvibe_user');
      localStorage.removeItem('sparkvibe_session');
      
      // Clear service worker cache if exists
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          if (registration.scope.includes('sparkvibe')) {
            await registration.unregister();
          }
        }
      }

      // Clear instance variables
      this.currentUser = null;
      this.isAuthenticated = false;

      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      // Force clear even if there's an error
      this.currentUser = null;
      this.isAuthenticated = false;
      return false;
    }
  }

  // Check if user is authenticated
  isLoggedIn() {
    return this.isAuthenticated && this.currentUser !== null;
  }

  // Get user display name (privacy-safe)
  getUserDisplayName() {
    return this.currentUser?.displayName || 'Anonymous User';
  }

  // Get user avatar (privacy-safe)
  getUserAvatar() {
    return this.currentUser?.avatar || '?';
  }

  // Refresh session
  async refreshSession() {
    try {
      const session = localStorage.getItem('sparkvibe_session');
      if (session) {
        const sessionData = JSON.parse(session);
        if (sessionData.expiresAt > Date.now()) {
          // Extend session by 24 hours
          sessionData.expiresAt = Date.now() + (24 * 60 * 60 * 1000);
          localStorage.setItem('sparkvibe_session', JSON.stringify(sessionData));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }

  // Delete account (privacy compliance)
  async deleteAccount() {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }

      // In a real app, this would call the backend to delete user data
      // For demo, we'll just logout
      await this.logout();
      
      // Clear any cached data
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes('sparkvibe')) {
            await caches.delete(cacheName);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Account deletion failed:', error);
      throw error;
    }
  }

  // Export user data (privacy compliance)
  async exportUserData() {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }

      const userData = {
        profile: this.currentUser,
        exportedAt: new Date().toISOString(),
        note: 'This export contains only the privacy-safe display data. Real personal information is not stored client-side.'
      };

      // Create downloadable file
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `sparkvibe-data-${this.currentUser.displayName}-${Date.now()}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Data export failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;