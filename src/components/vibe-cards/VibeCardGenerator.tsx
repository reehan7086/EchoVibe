import React, { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Sparkles, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { VibeEcho } from '../../types';

interface Profile {
  vibe_score: number;
  cards_shared: number;
  viral_score: number;
  [key: string]: any; // for other fields
}

interface VibeCardGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  post: VibeEcho;
  user: User;
  profile: Profile | null | undefined;
}

type CardTemplate = 'cosmic' | 'nature' | 'retro' | 'minimal';

interface CardData {
  adventure_summary: string;
  mood_boost: string;
  brain_bite: string;
  habit_nudge: string;
  vibe_points: number;
  streak_count: number;
  template_theme: CardTemplate;
}

const VibeCardGenerator: React.FC<VibeCardGeneratorProps> = ({
  isOpen,
  onClose,
  post,
  user,
  profile
}) => {
  const [currentStep, setCurrentStep] = useState<'mood' | 'adventure' | 'card' | 'share'>('mood');
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>('cosmic');
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const templates: Record<CardTemplate, { name: string; bg: string; accent: string }> = {
    cosmic: { name: 'Cosmic', bg: 'from-purple-900 via-blue-900 to-purple-900', accent: 'text-cyan-400' },
    nature: { name: 'Nature', bg: 'from-green-800 via-emerald-900 to-green-800', accent: 'text-green-300' },
    retro: { name: 'Retro', bg: 'from-pink-800 via-purple-900 to-orange-800', accent: 'text-pink-300' },
    minimal: { name: 'Minimal', bg: 'from-gray-900 via-slate-800 to-gray-900', accent: 'text-blue-300' }
  };

  useEffect(() => {
    if (!post) return; // guard against null
    const moodToTemplate: Record<string, CardTemplate> = {
      happy: 'cosmic',
      excited: 'retro',
      peaceful: 'nature',
      thoughtful: 'minimal',
      grateful: 'nature',
      creative: 'cosmic'
    };
    setSelectedTemplate(moodToTemplate[post.mood] || 'cosmic');
  }, [post]);
 
  const generateCardData = async () => {
    setGenerating(true);
    try {
      const mockCardData: CardData = {
        adventure_summary: `You shared "${post.content.slice(0, 50)}..." in ${post.mood} mood`,
        mood_boost: `Feeling ${post.mood}! Your vibe is contagious!`,
        brain_bite: "Did you know sharing positive moments increases happiness by 25%?",
        habit_nudge: "Daily sharing goal: Keep the good vibes flowing!",
        vibe_points: Math.floor(Math.random() * 100) + 50,
        streak_count: profile?.vibe_score || 1,
        template_theme: selectedTemplate
      };

      setCardData(mockCardData);
      setCurrentStep('card');
      
      setTimeout(() => {
        generateCardImage(mockCardData);
      }, 500);

    } catch (error) {
      console.error('Error generating card:', error);
    } finally {
      setGenerating(false);
    }
  };

  const generateCardImage = (data: CardData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 600;

    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    switch (data.template_theme) {
      case 'cosmic':
        gradient.addColorStop(0, '#1e1b4b');
        gradient.addColorStop(0.5, '#3730a3');
        gradient.addColorStop(1, '#1e1b4b');
        break;
      case 'nature':
        gradient.addColorStop(0, '#064e3b');
        gradient.addColorStop(0.5, '#047857');
        gradient.addColorStop(1, '#064e3b');
        break;
      case 'retro':
        gradient.addColorStop(0, '#be185d');
        gradient.addColorStop(0.5, '#7c2d12');
        gradient.addColorStop(1, '#be185d');
        break;
      case 'minimal':
        gradient.addColorStop(0, '#111827');
        gradient.addColorStop(0.5, '#374151');
        gradient.addColorStop(1, '#111827');
        break;
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 600);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('EchoVibe Card', 200, 50);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#e5e7eb';

    ctx.fillText('Adventure:', 200, 100);
    const lines = wrapText(ctx, data.adventure_summary, 350);
    lines.forEach((line, i) => {
      ctx.fillText(line, 200, 130 + i * 20);
    });

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(data.mood_boost, 200, 220);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`${data.vibe_points} Points`, 200, 280);
    ctx.fillText(`${data.streak_count} Day Streak`, 200, 310);

    ctx.font = '14px Arial';
    ctx.fillStyle = '#a78bfa';
    const brainLines = wrapText(ctx, data.brain_bite, 350);
    brainLines.forEach((line, i) => {
      ctx.fillText(line, 200, 360 + i * 18);
    });

    const imageData = canvas.toDataURL('image/png');
    setCardImage(imageData);
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const handleShare = async (platform: string) => {
    if (!cardData || !cardImage) return;

    try {
      await supabase.from('card_shares').insert([{
        card_id: cardData.adventure_summary,
        user_id: user.id,
        platform
      }]);

      if (profile) {
        await supabase
          .from('profiles')
          .update({ 
            cards_shared: Number(profile.cards_shared || 0) + 1,
            viral_score: Number(profile.viral_score || 0) + 0.1
          })
          .eq('user_id', user.id);
      }

      if (navigator.share && platform === 'native') {
        await navigator.share({
          title: 'Check out my EchoVibe Card!',
          text: cardData.adventure_summary,
          url: window.location.origin
        });
      } else {
        const shareUrls: Record<string, string> = {
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out my EchoVibe Card! ' + cardData.adventure_summary)}&url=${window.location.origin}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}`,
          instagram: 'instagram://camera',
          tiktok: 'https://www.tiktok.com/upload'
        };
        if (shareUrls[platform]) {
          window.open(shareUrls[platform], '_blank');
        }
      }

      setCurrentStep('share');
    } catch (error) {
      console.error('Error sharing card:', error);
    }
  };

  const downloadCard = () => {
    if (!cardImage) return;
    const link = document.createElement('a');
    link.download = `echovibe-card-${Date.now()}.png`;
    link.href = cardImage;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Create Vibe Card
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {currentStep === 'mood' && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="space-y-4"
              >
                <p className="text-white/80">Choose your card template:</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(templates).map(([key, template]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedTemplate(key as CardTemplate)}
                      className={`p-4 rounded-xl bg-gradient-to-br ${template.bg} border-2 transition-all ${
                        selectedTemplate === key 
                          ? 'border-purple-400 scale-105' 
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <div className={`font-bold ${template.accent}`}>{template.name}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentStep('adventure')}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white font-semibold hover:shadow-lg transition-all"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {currentStep === 'adventure' && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="space-y-4"
              >
                <p className="text-white/80">Ready to generate your card!</p>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-sm text-white/60">Preview:</p>
                  <p className="text-white font-medium">{post.content}</p>
                  <p className="text-purple-400 text-sm mt-2">Mood: {post.mood}</p>
                </div>
                <button
                  onClick={generateCardData}
                  disabled={generating}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate Vibe Card'}
                </button>
              </motion.div>
            )}

            {currentStep === 'card' && cardData && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="space-y-4"
              >
                <canvas
                  ref={canvasRef}
                  className="w-full rounded-xl border border-white/20"
                  style={{ aspectRatio: '2/3' }}
                />
                
                <div className="flex gap-2">
                  <button
                    onClick={downloadCard}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => handleShare('native')}
                    className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleShare('tiktok')}
                    className="py-2 bg-black rounded-lg text-white text-sm font-medium hover:bg-gray-800 transition-all"
                  >
                    TikTok
                  </button>
                  <button
                    onClick={() => handleShare('instagram')}
                    className="py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white text-sm font-medium transition-all"
                  >
                    Instagram
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 'share' && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Card Shared!</h3>
                <p className="text-white/80">Your vibe is now spreading across the internet!</p>
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white font-semibold"
                >
                  Done
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VibeCardGenerator;
