// src/components/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Zap,
  Chrome,
  Shield,
  Users,
  MapPin,
  MessageCircle,
  Sparkles,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const LoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkUser();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Google login failed');
      setLoading(false);
    }
  };

  const features = [
    {
      icon: MapPin,
      title: 'Secure Vibe Map',
      description: 'Discover nearby users with enhanced privacy controls'
    },
    {
      icon: MessageCircle,
      title: 'Safe Connections',
      description: 'Connect with verified users in your area'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your data is protected with enterprise-grade security'
    },
    {
      icon: Users,
      title: 'Verified Community',
      description: 'Join a community of authentic, verified users'
    }
  ];

  const benefits = [
    'End-to-end encrypted messaging',
    'Location privacy controls', 
    'Verified user authentication',
    'Advanced security features',
    'Real-time interaction radius',
    'Professional moderation'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">EchoVibe</h1>
            <p className="text-white/60 text-sm">Secure Social Discovery</p>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Marketing Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Connect with
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {' '}Real People
                </span>
                <br />
                Near You
              </h2>
              <p className="text-xl text-white/80 leading-relaxed">
                EchoVibe is the most secure way to discover and connect with verified users in your area. 
                Experience authentic social discovery with industry-leading privacy protection.
              </p>
            </div>

            {/* Benefits List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white/80 text-sm">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-white font-semibold">{feature.title}</h3>
                    </div>
                    <p className="text-white/70 text-sm">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-md">
              {/* Login Card */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Get Started</h3>
                  <p className="text-white/70">Join the secure social discovery platform</p>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6">
                    <p className="text-red-300 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Google Login Button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mb-6"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                  ) : (
                    <Chrome className="w-5 h-5" />
                  )}
                  {loading ? 'Signing in...' : 'Continue with Google'}
                </button>

                {/* Security Notice */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-medium text-sm">Secure Login</span>
                  </div>
                  <p className="text-white/70 text-xs">
                    Your authentication is protected by Google's enterprise security. 
                    We never store your password or personal data.
                  </p>
                </div>

                {/* Call to Action */}
                <div className="text-center">
                  <p className="text-white/60 text-sm mb-4">
                    Ready to discover your vibe community?
                  </p>
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    Join EchoVibe
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center gap-6 text-white/40 text-xs">
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>Enterprise Security</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified Users</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Privacy First</span>
                  </div>
                </div>
                <p className="text-white/40 text-xs mt-2">
                  By continuing, you agree to our{' '}
                  <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Floating Icons */}
        <div className="absolute top-1/4 right-1/3" style={{ animation: 'float 3s ease-in-out infinite' }}>
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white/40" />
          </div>
        </div>
        <div className="absolute bottom-1/3 left-1/4" style={{ animation: 'float 3s ease-in-out infinite 1s' }}>
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-white/40" />
          </div>
        </div>
        <div className="absolute top-1/2 right-1/4" style={{ animation: 'float 3s ease-in-out infinite 0.5s' }}>
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white/40" />
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px);
          }
          50% { 
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;