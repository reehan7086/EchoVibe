// src/components/pages/FeedPage.tsx - Redirect to Map
import React, { useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { MapPin, ArrowRight } from 'lucide-react';

interface FeedPageProps {
  user: User;
}

const FeedPage: React.FC<FeedPageProps> = ({ user }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <MapPin className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-4">
          Discover Your Local Vibe
        </h2>
        
        <p className="text-white/70 mb-6">
          SparkVibe is now all about connecting with people nearby! Use our interactive map to find and connect with like-minded individuals in your area.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-purple-400 font-medium">
          <span>Check out the Vibe Map</span>
          <ArrowRight className="w-4 h-4" />
        </div>
        
        <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-white/60 text-sm">
            💡 <strong>Tip:</strong> Click on the "Vibe Map" tab to start discovering people near you!
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedPage;