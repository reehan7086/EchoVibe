import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Search, Users, Hash, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';
import { debounce } from '../../utils';

interface SearchPageProps {
  user: User;
  profile: Profile | null;
}

type SearchResult = {
  type: 'user' | 'community' | 'hashtag';
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string;
  memberCount?: number;
};

const SearchPage: React.FC<SearchPageProps> = ({ user, profile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'communities'>('all');

  // Debounced search function
  const debouncedSearch = debounce(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results: SearchResult[] = [];

      // Search users
      if (activeTab === 'all' || activeTab === 'users') {
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          .neq('id', user.id)
          .limit(10);

        if (!usersError && users) {
          results.push(...users.map(user => ({
            type: 'user' as const,
            id: user.id,
            title: user.full_name || user.username,
            subtitle: `@${user.username}`,
            avatar: user.avatar_url || undefined
          })));
        }
      }

      // Search communities
      if (activeTab === 'all' || activeTab === 'communities') {
        const { data: communities, error: communitiesError } = await supabase
          .from('communities')
          .select('id, name, description, member_count')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .eq('is_active', true)
          .limit(10);

        if (!communitiesError && communities) {
          results.push(...communities.map(community => ({
            type: 'community' as const,
            id: community.id,
            title: community.name,
            subtitle: community.description || undefined,
            memberCount: community.member_count
          })));
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, activeTab]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'user') {
      // Navigate to user profile
      console.log('Navigate to user:', result.id);
    } else if (result.type === 'community') {
      // Navigate to community
      console.log('Navigate to community:', result.id);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users size={20} className="text-blue-400" />;
      case 'community':
        return <Hash size={20} className="text-green-400" />;
      default:
        return <Search size={20} className="text-gray-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Search Header */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Search</h2>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for people, communities..."
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
          />
        </div>

        {/* Search Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'users', label: 'People' },
            { key: 'communities', label: 'Communities' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {loading ? 'Searching...' : 'Results'}
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-3">
            {searchResults.map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="flex-shrink-0">
                  {result.avatar ? (
                    <img
                      src={result.avatar}
                      alt={result.title}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold">
                      {result.title[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getResultIcon(result.type)}
                    <h4 className="font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                      {result.title}
                    </h4>
                  </div>
                  {result.subtitle && (
                    <p className="text-sm text-white/60 truncate">{result.subtitle}</p>
                  )}
                  {result.memberCount !== undefined && (
                    <p className="text-xs text-white/40">{result.memberCount} members</p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded-full capitalize">
                    {result.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <p className="text-white/60">No results found for "{searchQuery}"</p>
            <p className="text-white/40 text-sm mt-2">
              Try searching for different keywords or check your spelling
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <Search className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <p className="text-white/60">Start typing to search</p>
            <p className="text-white/40 text-sm mt-2">
              Find people, communities, and more on SparkVibe
            </p>
          </div>
        )}
      </div>

      {/* Trending Section */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Trending</h3>
        <div className="space-y-3">
          {[
            { tag: '#happy', posts: '1.2k posts' },
            { tag: '#creative', posts: '856 posts' },
            { tag: '#coffee', posts: '642 posts' },
            { tag: '#weekend', posts: '423 posts' }
          ].map((trend, index) => (
            <div
              key={trend.tag}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
            >
              <div>
                <h4 className="font-medium text-purple-400">{trend.tag}</h4>
                <p className="text-sm text-white/60">{trend.posts}</p>
              </div>
              <Hash size={16} className="text-white/40" />
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Users */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Suggested for You</h3>
        <div className="space-y-3">
          <div className="text-center py-8 text-white/60">
            <Users className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <p>Suggested users will appear here</p>
            <p className="text-white/40 text-sm mt-2">
              Based on your interests and activity
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SearchPage;