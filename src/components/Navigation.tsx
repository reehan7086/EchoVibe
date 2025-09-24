import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SparkVibe
            </h1>
            <Badge variant="secondary" className="text-xs px-2 py-1">
              Beta
            </Badge>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#demo" className="text-sm hover:text-primary transition-colors">
              Demo
            </a>
            <a href="#waitlist" className="text-sm hover:text-primary transition-colors">
              Early Access
            </a>
          </div>

          {/* CTA Button */}
          <Button variant="hero" size="sm" className="font-medium">
            Join Waitlist
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;