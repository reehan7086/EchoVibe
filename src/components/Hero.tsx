import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      
      <div className="container mx-auto px-4 z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-6">
            <Badge variant="secondary" className="text-primary font-medium px-4 py-2">
              🚀 Coming Soon - Early Access
            </Badge>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              Find Your
              <span className="bg-gradient-primary bg-clip-text text-transparent animate-gradient-shift bg-300% ml-3">
                Vibe
              </span>
              <br />
              <span className="text-muted-foreground text-3xl lg:text-5xl">
                Connect Nearby
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-lg">
              AI-powered social discovery that matches your mood with strangers nearby. 
              Share your vibe through video, audio, or text and spark instant connections.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="text-lg px-8 py-6">
                Join Waitlist
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-muted-foreground justify-center lg:justify-start">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span>AI-Powered Matching</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <span>Privacy First</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-glow rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <span>Location Based</span>
              </div>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative">
            <div className="relative group">
              <img 
                src={heroImage} 
                alt="People connecting through EchoVibe app with vibrant energy waves" 
                className="w-full h-auto rounded-2xl shadow-card group-hover:shadow-glow transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-2xl group-hover:opacity-30 transition-opacity duration-500"></div>
              
              {/* Floating UI elements */}
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-semibold animate-float">
                ✨ AI Match
              </div>
              <div className="absolute -bottom-4 -left-4 bg-accent text-accent-foreground px-4 py-2 rounded-full font-semibold animate-float" style={{ animationDelay: '1s' }}>
                📍 Nearby
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;