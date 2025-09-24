import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const WaitlistForm = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Simulate form submission
    setIsSubmitted(true);
    toast({
      title: "You're on the list! 🎉",
      description: "We'll notify you when SparkVibe launches in your area.",
    });
  };

  return (
    <section className="py-24 px-4 bg-gradient-hero relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-background/90"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      
      <div className="container mx-auto relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <Badge variant="secondary" className="text-primary font-medium px-4 py-2 mb-6">
            🚀 Early Access
          </Badge>
          
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">
            Be the First to
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Echo</span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands already signed up for early access. Be among the first to experience 
            AI-powered social connections in your city.
          </p>

          <Card className="bg-card/80 backdrop-blur-sm shadow-card border-border/50">
            <CardContent className="p-8">
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 h-12 text-lg bg-background/50"
                      required
                    />
                    <Button 
                      type="submit" 
                      variant="hero" 
                      size="lg" 
                      className="h-12 px-8 text-lg whitespace-nowrap"
                    >
                      Join Waitlist
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    No spam, ever. Unsubscribe anytime. We respect your privacy.
                  </p>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-4xl mb-4">🎉</div>
                  <h3 className="text-2xl font-semibold text-primary">Welcome to the future!</h3>
                  <p className="text-muted-foreground">
                    You'll be among the first to know when SparkVibe launches in your area.
                    We're targeting early 2025 for our beta release.
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <Badge variant="outline">Position: #7,892</Badge>
                    <Badge variant="outline">Beta Access: Guaranteed</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">Early Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">2025</div>
              <div className="text-sm text-muted-foreground">Launch Year</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-glow">AI</div>
              <div className="text-sm text-muted-foreground">Powered</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WaitlistForm;