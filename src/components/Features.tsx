import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Features = () => {
  const features = [
    {
      icon: "🎯",
      title: "AI Vibe Matching",
      description: "Advanced AI analyzes your mood, interests, and energy to connect you with compatible people nearby.",
      badge: "Smart"
    },
    {
      icon: "📍",
      title: "Location Discovery",
      description: "Find interesting people within your chosen radius. From coffee shops to campus quads.",
      badge: "Nearby"
    },
    {
      icon: "🎭",
      title: "Anonymous Start",
      description: "Begin conversations anonymously, reveal profiles gradually as connections develop naturally.",
      badge: "Safe"
    },
    {
      icon: "🎬",
      title: "Multi-Format Vibes",
      description: "Express yourself through 15-30 second videos, voice notes, or text. Your mood, your way.",
      badge: "Creative"
    },
    {
      icon: "🏆",
      title: "Viral Challenges",
      description: "Participate in Vibe Duets, mood challenges, and collaborative content that spreads organically.",
      badge: "Trending"
    },
    {
      icon: "💫",
      title: "Gamified Social",
      description: "Earn echo points, unlock badges, and level up your social presence through meaningful interactions.",
      badge: "Rewarding"
    }
  ];

  return (
    <section className="py-24 px-4 bg-muted/20">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="text-primary font-medium px-4 py-2 mb-6">
            ✨ Features That Connect
          </Badge>
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">
            Why <span className="bg-gradient-primary bg-clip-text text-transparent">SparkVibe</span> Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Combining cutting-edge AI, location technology, and human psychology to create 
            the most natural way to meet new people.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-card transition-all duration-300 hover:-translate-y-2 bg-card/50 backdrop-blur-sm border-border/50"
            >
              <CardHeader className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;