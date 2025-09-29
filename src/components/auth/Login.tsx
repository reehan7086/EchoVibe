// Mobile-First Login Component Replacement
// Replace the content in src/components/auth/Login.tsx with this

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Chrome,
  Shield,
  AlertCircle,
  CheckCircle,
  Zap
} from 'lucide-react';

const CustomCheckbox: React.FC<{
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: React.ReactNode;
  id: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, id, disabled = false }) => (
  <label htmlFor={id} className="flex items-start gap-3 cursor-pointer touch-target">
    <div className="relative flex-shrink-0 mt-0.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
        disabled={disabled}
      />
      <div className={`w-5 h-5 border-2 rounded transition-all ${
        checked 
          ? 'bg-purple-600 border-purple-600' 
          : 'bg-white/10 border-white/40'
      } ${disabled ? 'opacity-50' : ''}`}>
        {checked && (
          <svg 
            className="w-3 h-3 text-white absolute top-0.5 left-0.5" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
              clipRule="evenodd" 
            />
          </svg>
        )}
      </div>
    </div>
    <span className={`text-white/80 text-sm leading-relaxed ${disabled ? 'opacity-50' : ''}`}>
      {label}
    </span>
  </label>
);

const Login: React.FC<{ redirectTo?: string }> = ({ redirectTo = '/dashboard' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmailLogin, setIsEmailLogin] = useState(false);
  const [message, setMessage] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const message = searchParams.get('message');
    
    if (success === 'true' && message) {
      setMessage(decodeURIComponent(message));
      setTimeout(() => setMessage(''), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate(redirectTo);
      }
    };
    checkUser();
  }, [navigate, redirectTo]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted || !privacyAccepted) {
      setError('You must accept both the Terms of Service and Privacy Policy to proceed.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        navigate(redirectTo);
      }
    } catch (error: any) {
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!termsAccepted || !privacyAccepted) {
      setError('You must accept both the Terms of Service and Privacy Policy to proceed.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectTo}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Google login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setMessage('Password reset email sent! Check your inbox.');
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden flex items-center justify-center p-4">
      {/* Background decorations - simplified for mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand - Mobile optimized */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white">SparkVibe</h1>
              <p className="text-white/60 text-sm">Social Discovery</p>
            </div>
          </div>
        </div>

        {/* Main Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 md:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Welcome Back</h3>
            <p className="text-white/70 text-sm">Sign in to continue</p>
          </div>

          {message && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-300 text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {!isEmailLogin ? (
            <div className="space-y-4">
              {/* Terms & Privacy */}
              <div className="space-y-3 mb-4">
                <CustomCheckbox
                  id="terms-login-google"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={loading}
                  label={
                    <>
                      I agree to the <Link to="/terms" className="underline text-purple-400">Terms of Service</Link>
                    </>
                  }
                />
                <CustomCheckbox
                  id="privacy-login-google"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  disabled={loading}
                  label={
                    <>
                      I agree to the <Link to="/privacy" className="underline text-purple-400">Privacy Policy</Link>
                    </>
                  }
                />
              </div>

              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading || !termsAccepted || !privacyAccepted}
                className="touch-target w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                ) : (
                  <Chrome className="w-5 h-5" />
                )}
                <span className="text-sm md:text-base">{loading ? 'Signing in...' : 'Continue with Google'}</span>
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-slate-900 px-4 text-white/60">or</span>
                </div>
              </div>

              {/* Email Login Button */}
              <button
                onClick={() => setIsEmailLogin(true)}
                className="touch-target w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium py-3 px-4 rounded-xl transition-all active:scale-95"
              >
                <Mail className="w-5 h-5" />
                <span className="text-sm md:text-base">Sign in with Email</span>
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={() => setIsEmailLogin(false)}
                className="text-white/60 hover:text-white text-sm mb-4 flex items-center gap-2 touch-target"
              >
                ← Back
              </button>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-white/80 text-sm font-medium mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mobile-form-field w-full pl-11 pr-4 py-3"
                      placeholder="your@email.com"
                      required
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-white/80 text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mobile-form-field w-full pl-11 pr-12 py-3"
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 touch-target"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium touch-target"
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Terms & Privacy */}
                <div className="space-y-3">
                  <CustomCheckbox
                    id="terms-login-email"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    disabled={loading}
                    label={
                      <>
                        I agree to the <Link to="/terms" className="underline text-purple-400">Terms</Link>
                      </>
                    }
                  />
                  <CustomCheckbox
                    id="privacy-login-email"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    disabled={loading}
                    label={
                      <>
                        I agree to the <Link to="/privacy" className="underline text-purple-400">Privacy Policy</Link>
                      </>
                    }
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !termsAccepted || !privacyAccepted}
                  className="touch-target w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95"
                >
                  {loading && (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span className="text-sm md:text-base">{loading ? 'Signing in...' : 'Sign In'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Security Badge */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center justify-center gap-2 text-xs text-white/60">
              <Shield className="w-4 h-4 text-green-400" />
              <span>Secure Authentication</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;