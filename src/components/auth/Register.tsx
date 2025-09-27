
// src/components/auth/Register.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User,
  Zap,
  ArrowRight,
  Chrome,
  Shield,
  Sparkles,
  AlertCircle,
  CheckCircle,
  MapPin,
  Users as UsersIcon
} from 'lucide-react';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmailRegister, setIsEmailRegister] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkUser();
  }, [navigate]);

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        navigate('/login?success=true&message=Registration successful! Please check your email to verify your account.');
      }
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');

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
    } catch (error: any) {
      setError(error.message || 'Google registration failed. Please try again.');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const benefits = [
    'Discover nearby verified users',
    'End-to-end encrypted messaging',
    'Advanced privacy controls',
    'Secure location sharing',
    'Professional moderation',
    '24/7 customer support'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Side - Benefits */}
          <div className="hidden lg:block space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">EchoVibe</h1>
                  <p className="text-white/60">Secure Social Discovery</p>
                </div>
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Join the
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {' '}Secure Community
                </span>
              </h2>
              <p className="text-lg text-white/80 leading-relaxed">
                Start your journey of authentic connections with enterprise-grade security and privacy protection.
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white/80">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="flex items-center gap-2 text-white/60">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span className="text-sm">Location Privacy</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm">Verified Users</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <UsersIcon className="w-4 h-4 text-blue-400" />
                <span className="text-sm">Safe Community</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-sm">Premium Features</span>
              </div>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              {/* Registration Card */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Create Account</h3>
                  <p className="text-white/70">Join EchoVibe today</p>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                {!isEmailRegister ? (
                  // Social Registration Options
                  <div className="space-y-4">
                    <button
                      onClick={handleGoogleRegister}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-4 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                      ) : (
                        <Chrome className="w-5 h-5" />
                      )}
                      {loading ? 'Creating account...' : 'Sign up with Google'}
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/20"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-slate-900 px-4 text-white/60">or sign up with email</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsEmailRegister(true)}
                      className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium py-3 px-4 rounded-xl transition-all duration-200 hover:border-white/30"
                    >
                      <Mail className="w-5 h-5" />
                      Sign up with Email
                    </button>
                  </div>
                ) : (
                  // Email Registration Form
                  <div>
                    <button
                      onClick={() => setIsEmailRegister(false)}
                      className="text-white/60 hover:text-white text-sm mb-4 flex items-center gap-2 transition-colors hover:underline"
                    >
                      ← Back to other options
                    </button>

                    <form onSubmit={handleEmailRegister} className="space-y-4">
                      <div>
                        <label htmlFor="fullName" className="block text-white/80 text-sm font-medium mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                          <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all duration-200"
                            placeholder="Enter your full name"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-white/80 text-sm font-medium mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                          <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all duration-200"
                            placeholder="Enter your email"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-white/80 text-sm font-medium mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                          <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleInputChange}
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

                      <div>
                        <label htmlFor="confirmPassword" className="block text-white/80 text-sm font-medium mb-2">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                          <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
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

                      <button
                        type="submit"
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
                    </form>
                  </div>
                )}

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

                {/* Security Features */}
                <div className="mt-8 pt-6 border-t border-white/20">
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-2 text-white/60">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span>Your data is secure with us</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-6">
                <p className="text-white/40 text-sm">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors hover:underline">
                    Terms
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
  );
};

export default Register;