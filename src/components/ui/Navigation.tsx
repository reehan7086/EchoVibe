// src/components/ui/Navigation.tsx - Updated with SecureVibeMap routing
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  MapPin, 
  MessageCircle, 
  User, 
  Bell, 
  Settings,
  Shield,
  Zap
} from 'lucide-react';

interface NavigationProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

const Navigation: React.FC<NavigationProps> = ({ 
  className = '', 
  orientation = 'horizontal' 
}) => {
  const location = useLocation();

  const navItems = [
    {
      path: '/dashboard',
      icon: Home,
      label: 'Feed',
      description: 'Your vibe feed'
    },
    {
      path: '/map',
      icon: MapPin,
      label: 'Vibe Map',
      description: 'Discover nearby vibes',
      badge: 'Enhanced' // Indicate it's the new secure version
    },
    {
      path: '/chat',
      icon: MessageCircle,
      label: 'Chat',
      description: 'Messages & conversations'
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profile',
      description: 'Your vibe profile'
    },
    {
      path: '/notifications',
      icon: Bell,
      label: 'Alerts',
      description: 'Notifications & updates'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      description: 'App preferences'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  if (orientation === 'vertical') {
    return (
      <nav className={`space-y-2 ${className}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${
                active
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                active ? 'text-purple-400' : ''
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/50">{item.description}</p>
              </div>
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  // Horizontal navigation (for mobile bottom bar)
  return (
    <nav className={`flex justify-around items-center ${className}`}>
      {navItems.slice(0, 5).map((item) => { // Only show first 5 in horizontal
        const Icon = item.icon;
        const active = isActive(item.path);
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all relative ${
              active
                ? 'text-purple-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <div className="relative">
              <Icon className="w-6 h-6" />
              {item.badge && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-slate-900" />
              )}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
            {active && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default Navigation;