import React from 'react';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Comment } from '../../types';
import { formatDate } from '../../utils';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string | null;
  comments: Comment[];
  newComment: string;
  setNewComment: (content: string) => void;
  onSubmitComment: () => void;
  currentUser: User | null;
}

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  postId,
  comments,
  newComment,
  setNewComment,
  onSubmitComment,
  currentUser
}) => {
  if (!isOpen || !postId) return null;

  const handleSubmit = () => {
    if (newComment.trim()) {
      onSubmitComment();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-800 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <h3 className="font-semibold text-lg text-white">Comments</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-all text-white"
              aria-label="Close comment modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-64">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {comment.profiles?.avatar_url ? (
                        <img
                          src={comment.profiles.avatar_url}
                          alt={comment.profiles?.full_name || 'User'}
                          className="w-full h-full rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        comment.profiles?.full_name?.[0] || 'U'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-white truncate">
                          {comment.profiles?.full_name || 'Unknown User'}
                        </p>
                        <span className="text-xs text-white/40 flex-shrink-0">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed break-words">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <Send size={24} className="text-white/40" />
                </div>
                <p className="text-sm text-white/60 mb-1">No comments yet</p>
                <p className="text-xs text-white/40">Be the first to share your thoughts!</p>
              </div>
            )}
          </div>

          {/* Comment Input */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {currentUser?.user_metadata?.avatar_url ? (
                  <img
                    src={currentUser.user_metadata.avatar_url}
                    alt="Your avatar"
                    className="w-full h-full rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  currentUser?.user_metadata?.full_name?.[0]?.toUpperCase() || 
                  currentUser?.email?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write your comment..."
                  className="w-full bg-white/10 rounded-lg p-3 text-white placeholder-white/40 border border-white/20 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                  rows={3}
                  maxLength={500}
                  aria-label="Comment input"
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-white/40">
                    {newComment.length}/500 • Press Enter to post, Shift+Enter for new line
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-2"
                    aria-label="Post comment"
                  >
                    <Send size={14} />
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CommentModal;