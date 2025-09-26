import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Users, Plus, Search, Filter, X } from 'lucide-react'; // Added X import
import { supabase } from '../../lib/supabase'; // Fixed import
import { Community } from '../../types';

interface CommunitiesPageProps {
  user: User;
}

const CommunitiesPage: React.FC<CommunitiesPageProps> = ({ user }) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    category: 'general'
  });

  const categories = [
    'all', 'general', 'technology', 'art', 'music', 'sports', 
    'gaming', 'books', 'movies', 'food', 'travel', 'fitness'
  ];

  useEffect(() => {
    fetchCommunities();
    
    const subscription = supabase
      .channel('communities')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'communities' }, (payload: any) => { // Fixed payload type
        setCommunities((prev) => [{ ...payload.new, is_member: false } as Community, ...prev]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      
      let membershipIds = new Set();
      if (user) {
        const { data: membershipsData, error: membershipsError } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', user.id);
        
        if (membershipsError) throw new Error(`Error fetching memberships: ${membershipsError.message}`);
        membershipIds = new Set(membershipsData?.map((m: any) => m.community_id) || []); // Fixed m type
      }
      
      const { data, error } = await supabase
        .from('communities')
        .select('id, name, description, category, member_count, created_at, is_active')
        .eq('is_active', true)
        .order('member_count', { ascending: false });
      
      if (error) throw new Error(`Error fetching communities: ${error.message}`);
      
      setCommunities(
        (data || []).map((community: any) => ({ // Fixed community type
          ...community,
          is_member: membershipIds.has(community.id),
        }))
      );
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .insert([{ community_id: communityId, user_id: user.id }]);
      
      if (error) throw new Error(`Error joining community: ${error.message}`);
      
      setCommunities((prev) =>
        prev.map((community) =>
          community.id === communityId
            ? { ...community, is_member: true, member_count: community.member_count + 1 }
            : community
        )
      );
    } catch (error) {
      console.error('Error joining community:', error);
      alert('Failed to join community.');
    }
  };

  const handleLeaveCommunity = async (communityId: string) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .match({ community_id: communityId, user_id: user.id });
      
      if (error) throw new Error(`Error leaving community: ${error.message}`);
      
      setCommunities((prev) =>
        prev.map((community) =>
          community.id === communityId
            ? { ...community, is_member: false, member_count: Math.max(0, community.member_count - 1) }
            : community
        )
      );
    } catch (error) {
      console.error('Error leaving community:', error);
      alert('Failed to leave community.');
    }
  };

  const handleCreateCommunity = async () => {
    if (!newCommunity.name.trim() || !newCommunity.description.trim()) {
      alert('Please fill in all fields.');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('communities')
        .insert([{
          name: newCommunity.name.trim(),
          description: newCommunity.description.trim(),
          category: newCommunity.category,
          creator_id: user.id,
          member_count: 1,
          is_active: true
        }])
        .select()
        .single();
      
      if (error) throw new Error(`Error creating community: ${error.message}`);
      
      // Auto-join the creator
      await supabase
        .from('community_members')
        .insert([{ community_id: data.id, user_id: user.id }]);
      
      setCommunities((prev) => [{ ...data, is_member: true } as Community, ...prev]);
      setShowCreateModal(false);
      setNewCommunity({ name: '', description: '', category: 'general' });
    } catch (error) {
      console.error('Error creating community:', error);
      alert('Failed to create community.');
    }
  };

  const filteredCommunities = communities.filter(community => {
    const matchesCategory = categoryFilter === 'all' || community.category === categoryFilter;
    const matchesSearch = !searchQuery || 
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const myCommunities = communities.filter(c => c.is_member);
  const recommendedCommunities = communities.filter(c => !c.is_member).slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users size={24} />
              Communities
            </h2>
            <p className="text-white/60 mt-1">Discover and join communities that match your interests</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            Create Community
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities..."
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-white/40" size={16} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400"
            >
              {categories.map((category) => (
                <option key={category} value={category} className="bg-slate-800">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* My Communities */}
      {myCommunities.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">My Communities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCommunities.map((community) => (
              <div key={community.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-purple-400">{community.name}</h4>
                    <p className="text-sm text-white/60 mt-1">{community.description}</p>
                  </div>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                    {community.category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/40">
                    {community.member_count} members
                  </p>
                  <button
                    onClick={() => handleLeaveCommunity(community.id)}
                    className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-500 transition-all"
                  >
                    Leave
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Communities */}
      {recommendedCommunities.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Recommended for You</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedCommunities.map((community) => (
              <div key={community.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-purple-400">{community.name}</h4>
                    <p className="text-sm text-white/60 mt-1">{community.description}</p>
                  </div>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                    {community.category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/40">
                    {community.member_count} members
                  </p>
                  <button
                    onClick={() => handleJoinCommunity(community.id)}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-500 transition-all"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Communities */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">
          All Communities {filteredCommunities.length > 0 && `(${filteredCommunities.length})`}
        </h3>
        <div className="space-y-4">
          {filteredCommunities.length > 0 ? (
            filteredCommunities.map((community) => (
              <div key={community.id} className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-purple-400">{community.name}</h4>
                      <span className="text-xs bg-gray-500/20 text-gray-300 px-2 py-1 rounded-full">
                        {community.category}
                      </span>
                      {community.is_member && (
                        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                          Member
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 mb-2">{community.description}</p>
                    <p className="text-xs text-white/40">
                      {community.member_count} members
                    </p>
                  </div>
                  <button
                    onClick={() => 
                      community.is_member 
                        ? handleLeaveCommunity(community.id) 
                        : handleJoinCommunity(community.id)
                    }
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      community.is_member
                        ? 'bg-slate-600 text-white hover:bg-slate-500'
                        : 'bg-purple-600 text-white hover:bg-purple-500'
                    }`}
                  >
                    {community.is_member ? 'Leave' : 'Join'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-white/60">
              <Users className="w-12 h-12 mx-auto mb-4 text-white/40" />
              <p>No communities found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-md">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-semibold text-white">Create New Community</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Community Name</label>
                <input
                  value={newCommunity.name}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter community name"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Description</label>
                <textarea
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your community"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 resize-none"
                  rows={3}
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Category</label>
                <select
                  value={newCommunity.category}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-400"
                >
                  {categories.slice(1).map((category) => (
                    <option key={category} value={category} className="bg-slate-800">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCommunity}
                  disabled={!newCommunity.name.trim() || !newCommunity.description.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CommunitiesPage;