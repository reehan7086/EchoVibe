import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Heart, 
  Users, 
  MapPin, 
  Zap, 
  Star,
  ArrowRight,
  Globe,
  Music,
  Camera,
  MessageCircle,
  Play,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';

const LandingPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, name);
        toast({
          title: "🎉 Welcome to SparkVibe!",
          description: "Your account has been created successfully!",
        });
      } else {
        await signIn(email, password);
        toast({
          title: "✨ Welcome back!",
          description: "You're now connected to your vibe tribe!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Oops!",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      // Implement Google OAuth here
      toast({
        title: "🚀 Coming Soon!",
        description: "Google login will be available in the next update!",
      });
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-yellow-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-40 right-1/3 w-64 h-64 bg-green-500/20 rounded-full blur-3xl animate-pulse delay-3000"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 animate-float">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="absolute top-1/3 right-1/4 animate-float delay-1000">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="absolute bottom-1/4 left-1/3 animate-float delay-2000">
          <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="absolute bottom-1/3 right-1/3 animate-float delay-3000">
          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 min-h-screen items-center">
          
          {/* Left Side - Hero Content */}
          <div className="text-center lg:text-left space-y-8">
            {/* Logo & Badge */}
            <div className="space-y-4">
              <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0 px-4 py-2 text-sm font-semibold">
                🚀 Join 50K+ Vibers Worldwide
              </Badge>
              
              <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight">
                Find Your
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-shift bg-300% ml-4">
                  Vibe
                </span>
                <br />
                <span className="text-3xl lg:text-5xl text-gray-300 font-light">
                  Connect Instantly
                </span>
              </h1>
            </div>

            {/* Description */}
            <p className="text-xl text-gray-300 max-w-lg leading-relaxed">
              Discover people who match your energy nearby. Share your mood through 
              <span className="text-pink-400 font-semibold"> video</span>, 
              <span className="text-cyan-400 font-semibold"> audio</span>, or 
              <span className="text-yellow-400 font-semibold"> text</span> and spark 
              <span className="text-green-400 font-semibold"> instant connections</span>.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 max-w-lg">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-3">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium">Find Nearby</span>
              </div>
              
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-3">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium">AI Matching</span>
              </div>
              
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-3">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium">Safe & Fun</span>
              </div>
              
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium">Global Vibes</span>
              </div>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center lg:justify-start space-x-6 text-gray-300">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-sm">Join thousands of vibers</span>
              </div>
              
              <div className="flex items-center space-x-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
                <span className="text-sm ml-2">4.9/5 App Store</span>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {isSignUp ? 'Join the Vibe' : 'Welcome Back'}
                  </h2>
                  <p className="text-gray-300">
                    {isSignUp 
                      ? 'Create your account and start vibing!' 
                      : 'Sign in to continue your vibe journey'
                    }
                  </p>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-6">
                  {isSignUp && (
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Your Name
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:border-pink-400 focus:ring-pink-400"
                        required={isSignUp}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:border-pink-400 focus:ring-pink-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:border-pink-400 focus:ring-pink-400 pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Getting your vibe ready...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </form>

                <div className="my-6 flex items-center">
                  <hr className="flex-1 border-white/20" />
                  <span className="px-4 text-white/60 text-sm">or</span>
                  <hr className="flex-1 border-white/20" />
                </div>

                <Button
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  variant="outline"
                  className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 font-medium py-3 rounded-lg transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </div>
                </Button>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-white/80 hover:text-white text-sm transition-colors"
                  >
                    {isSignUp 
                      ? 'Already have an account? Sign in' 
                      : "Don't have an account? Join the vibe"
                    }
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-xs text-white/60">
                    By continuing, you agree to our{' '}
                    <a href="#" className="text-pink-400 hover:text-pink-300">Terms</a>
                    {' '}and{' '}
                    <a href="#" className="text-pink-400 hover:text-pink-300">Privacy Policy</a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">50K+</div>
            <div className="text-gray-300 text-sm">Active Vibers</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">2M+</div>
            <div className="text-gray-300 text-sm">Connections Made</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">150+</div>
            <div className="text-gray-300 text-sm">Countries</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">4.9★</div>
            <div className="text-gray-300 text-sm">App Rating</div>
          </div>
        </div>

        {/* Preview Cards */}
        <div className="mt-16 relative">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            See how people are vibing right now
          </h3>
          
          <div className="flex justify-center space-x-4 overflow-hidden">
            {/* Sample Vibe Cards */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 w-72 animate-float">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div>
                  <div className="text-white font-medium">Sarah</div>
                  <div className="text-gray-300 text-sm">2 blocks away</div>
                </div>
              </div>
              <p className="text-white text-sm mb-3">
                "Just finished an amazing yoga session in the park! ✨ Anyone want to grab smoothies? 🥤"
              </p>
              <div className="flex space-x-2">
                <Badge className="bg-yellow-500/20 text-yellow-300 border-0">😌 Zen</Badge>
                <Badge className="bg-green-500/20 text-green-300 border-0">🧘 Yoga</Badge>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 w-72 animate-float delay-1000 hidden md:block">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div>
                  <div className="text-white font-medium">Mike</div>
                  <div className="text-gray-300 text-sm">1.2 km away</div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 mb-3 flex items-center space-x-2">
                <Play className="w-4 h-4 text-white" />
                <div className="flex-1 h-2 bg-gray-600 rounded">
                  <div className="h-2 bg-cyan-400 rounded w-1/3"></div>
                </div>
                <span className="text-white text-xs">0:45</span>
              </div>
              <div className="flex space-x-2">
                <Badge className="bg-orange-500/20 text-orange-300 border-0">🎵 Music</Badge>
                <Badge className="bg-red-500/20 text-red-300 border-0">⚡ Energetic</Badge>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 w-72 animate-float delay-2000 hidden lg:block">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div>
                  <div className="text-white font-medium">Alex</div>
                  <div className="text-gray-300 text-sm">0.5 km away</div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg h-32 mb-3 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-white text-sm mb-3">
                "Coffee art attempt #47 ☕️ Getting better!"
              </p>
              <div className="flex space-x-2">
                <Badge className="bg-yellow-500/20 text-yellow-300 border-0">😊 Happy</Badge>
                <Badge className="bg-purple-500/20 text-purple-300 border-0">☕ Coffee</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;