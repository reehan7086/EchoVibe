// src/components/pages/SignUpPage.tsx - Fixed with proper profile creation
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { 
  Mail, Lock, Eye, EyeOff, User, Chrome, AlertCircle, CheckCircle, 
  Zap, ArrowRight, Shield, MapPin 
} from 'lucide-react';
import { generateUsername } from '../../utils';

const SignUpPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    username: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Account Creation
  const navigate = useNavigate();

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-generate username from full name
    if (field === 'fullName' && value) {
      setFormData(prev => ({
        ...prev,
        username: generateUsername(value)
      }));
    }
    
    // Clear errors when user types
    if (error) setError(null);
  };

  // Validate form data
  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    return true;
  };

  // Handle email signup
  const handleEmailSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            username: formData.username.trim(),
            preferred_username: formData.username.trim()
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // The trigger should create the profile automatically, but let's ensure it exists
        // Wait a moment for the trigger to fire
        setTimeout(async () => {
          try {
            // Check if profile was created by trigger
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', authData.user!.id)
              .single();

            // If no profile exists, create one manually
            if (!existingProfile) {
              await supabase
                .from('profiles')
                .insert({
                  id: authData.user!.id,
                  user_id: authData.user!.id,
                  username: formData.username.trim(),
                  full_name: formData.fullName.trim(),
                  bio: '',
                  privacy_level: 'public',
                  vibe_score: 50,
                  is_verified: false,
                  is_online: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
            }
          } catch (profileError) {
            console.error('Profile creation error:', profileError);
          }
        }, 1000);

        // Redirect to login with success message
        navigate('/login?success=true&message=' + encodeURIComponent('Account created successfully! Please check your email to verify your account.'));
      }
    } catch (err: any) {
      console.error('SignUp error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google signup
  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Google signup error:', err);
      setError(err.message || 'Google sign up failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Side - Marketing Content */}
          <div className="hidden lg:flex flex-col justify-center space-y-8 px-4 lg:px-0">
          <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">SparkVibe</h1>
                  <p className="text-white/60">Secure Social Discovery</p>
                </div>
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Join Your Local
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {' '}Community
                </span>
              </h2>
              <p className="text-lg text-white/80 leading-relaxed">
                Connect with like-minded people nearby. Share your vibe, discover local communities, and build authentic relationships.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 gap-4">
              {[
                { icon: MapPin, title: 'Location-Based Discovery', desc: 'Find people and communities in your area' },
                { icon: Shield, title: 'Privacy First', desc: 'Control your visibility and data sharing' },
                { icon: Zap, title: 'Instant Connections', desc: 'Real-time matching with nearby users' }
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{feature.title}</h3>
                      <p className="text-white/60 text-sm">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Create Your Account</h3>
                  <p className="text-white/70">Join the SparkVibe community</p>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Google Signup */}
                  <button
                    onClick={handleGoogleSignUp}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-4 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                    ) : (
                      <Chrome className="w-5 h-5" />
                    )}
                    {loading ? 'Creating account...' : 'Continue with Google'}
                  </button>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/20"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-slate-900 px-4 text-white/60">or create with email</span>
                    </div>
                  </div>

                  {/* Email Signup Form */}
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="fullName" className="block text-white/80 text-sm font-medium mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          id="fullName"
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all duration-200"
                          placeholder="Enter your full name"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Username */}
                    <div>
                      <label htmlFor="username" className="block text-white/80 text-sm font-medium mb-2">
                        Username
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40">@</span>
                        <input
                          id="username"
                          type="text"
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                          className="w-full pl-8 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all duration-200"
                          placeholder="your_username"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-white/80 text-sm font-medium mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all duration-200"
                          placeholder="Enter your email"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block text-white/80 text-sm font-medium mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all duration-200"
                          placeholder="Create a password"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                          disabled={loading}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-white/80 text-sm font-medium mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all duration-200"
                          placeholder="Confirm your password"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                          disabled={loading}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Create Account Button */}
                    <button
                      onClick={handleEmailSignUp}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Login Link */}
                <div className="mt-6 text-center">
                  <p className="text-white/60 text-sm">
                    Already have an account?{' '}
                    <Link 
                      to="/login" 
                      className="text-purple-400 hover:text-purple-300 font-medium transition-colors hover:underline"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>

                {/* Terms */}
                <div className="mt-8 pt-6 border-t border-white/20 text-center">
                  <p className="text-white/40 text-xs">
                    By creating an account, you agree to our{' '}
                    <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors hover:underline">
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;