import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, MessageCircle, Users, Zap, Smile, Menu, X, Heart } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const features = [
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Find Your Vibe Nearby",
      description: "Discover people with similar energy and interests within your vicinity using our interactive vibe map.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Connections",
      description: "Connect with compatible souls around you in real-time. No endless swiping, just genuine proximity-based matching.",
      color: "from-purple-500 to-violet-500"
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Meaningful Conversations",
      description: "Start authentic chats with nearby people who share your current mood and interests.",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Local Communities",
      description: "Join location-based communities and meet people who are actually around you.",
      color: "from-amber-500 to-orange-500"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Local Explorer",
      avatar: "👩‍💼",
      content: "I've met so many amazing people near my neighborhood! SparkVibe made real connections possible.",
      rating: 5
    },
    {
      name: "Marcus Chen",
      role: "Community Builder",
      avatar: "👨‍💻",
      content: "The map feature is incredible. I can see who's nearby and connect instantly. No more lonely coffee breaks!",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Digital Nomad",
      avatar: "👩‍🎨",
      content: "Wherever I travel, SparkVibe helps me find my tribe. It's like having instant local friends.",
      rating: 5
    },
    {
      name: "Alex Kim",
      role: "Social Butterfly",
      avatar: "👨‍🔧",
      content: "Finally, an app that connects you with people who are actually around! Perfect for spontaneous meetups.",
      rating: 5
    }
  ];

  const stats = [
    { number: "15K+", label: "Local Connections" },
    { number: "100K+", label: "Proximity Matches" },
    { number: "50+", label: "Cities Covered" },
    { number: "2.3M", label: "Messages Sent" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-2"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                SparkVibe
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
              <a href="#testimonials" className="text-white/80 hover:text-white transition-colors">Stories</a>
              <a href="#stats" className="text-white/80 hover:text-white transition-colors">Impact</a>
              <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-white/80 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  Find Your Vibe
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="md:hidden pb-4"
              >
                <div className="flex flex-col space-y-4">
                  <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-white/80 hover:text-white transition-colors">Features</a>
                  <a href="#testimonials" onClick={() => setIsMenuOpen(false)} className="text-white/80 hover:text-white transition-colors">Stories</a>
                  <a href="#stats" onClick={() => setIsMenuOpen(false)} className="text-white/80 hover:text-white transition-colors">Impact</a>
                  <a href="#about" onClick={() => setIsMenuOpen(false)} className="text-white/80 hover:text-white transition-colors">About</a>
                  <Link 
                    to="/login" 
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-2 text-white/80 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={() => setIsMenuOpen(false)}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all text-center"
                  >
                    Find Your Vibe
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-20 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent)]" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-5 h-5 bg-pink-400 rounded-full animate-pulse delay-2000"></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-3000"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center max-w-4xl mx-auto z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
              <MapPin className="w-5 h-5 text-purple-400" />
              <span className="text-white/90">Location-based social discovery</span>
            </div>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent leading-tight">
            Find Your Vibe
            <br />
            <span className="text-4xl md:text-5xl">Right Around You</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto">
            Connect with like-minded people in your area. Share your mood, discover your tribe, and spark real connections nearby.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/signup" 
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              Start Connecting Now
            </Link>
            <Link 
              to="/login" 
              className="px-8 py-4 border-2 border-purple-500 rounded-full font-bold text-lg hover:bg-purple-500/10 transition-all transform hover:scale-105"
            >
              I Already Have an Account
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-12"
          >
            <div className="flex items-center justify-center gap-8 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Real-time location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Instant matching</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>Secure & private</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-black/20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
          >
            How SparkVibe Works
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className={`p-4 rounded-full bg-gradient-to-br ${feature.color} mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                  <p className="text-white/70">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
          >
            Three Simple Steps
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Share Your Vibe</h3>
              <p className="text-white/70">Set your current mood and let others nearby know what energy you're bringing to the world.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Discover Nearby</h3>
              <p className="text-white/70">Explore our interactive map to find people with compatible vibes in your area.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Connect & Chat</h3>
              <p className="text-white/70">Send connection requests and start meaningful conversations with people around you.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
          >
            Real Stories from Real People
          </motion.h2>
          <div className="relative max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center shadow-lg"
              >
                <div className="text-3xl mb-4">{testimonials[currentTestimonial].avatar}</div>
                <p className="text-xl mb-4 italic text-white/90">"{testimonials[currentTestimonial].content}"</p>
                <div className="flex justify-center mb-2">
                  {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <h4 className="font-semibold text-white">{testimonials[currentTestimonial].name}</h4>
                <p className="text-white/60">{testimonials[currentTestimonial].role}</p>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentTestimonial === index ? 'bg-purple-500 scale-125' : 'bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05),transparent)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
          >
            Connecting Communities Worldwide
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-6 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-white/70">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-black/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
          >
            The Future of Local Connection
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-white/80 mb-12"
          >
            SparkVibe bridges the gap between digital connection and real-world proximity. We believe the best relationships start with people who are actually around you, sharing your space and your energy. Join the movement that's bringing authentic human connection back to your neighborhood.
          </motion.p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
              <Heart className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Authentic</h3>
              <p className="text-white/70 text-sm">Real people, real locations, real connections.</p>
            </div>
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
              <MapPin className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Proximity-Based</h3>
              <p className="text-white/70 text-sm">Connect with people who are actually nearby.</p>
            </div>
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Instant</h3>
              <p className="text-white/70 text-sm">No waiting, no algorithms - just immediate connection.</p>
            </div>
          </div>

          <Link 
            to="/signup" 
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-105 inline-flex items-center gap-2"
          >
            <MapPin className="w-5 h-5" />
            Start Your Journey
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-white/60 text-sm">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <MapPin className="w-5 h-5 text-purple-400" />
            <span>SparkVibe © 2025 - Connecting communities worldwide</span>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;