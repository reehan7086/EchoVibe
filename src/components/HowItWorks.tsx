import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const HowItWorks = () => {
  const steps = [
    {
      step: "01",
      title: "Share Your Vibe",
      description: "Create a 15-30 second video, voice note, or text expressing your current mood or activity.",
      color: "bg-primary"
    },
    {
      step: "02", 
      title: "AI Finds Matches",
      description: "Our AI analyzes your vibe and matches you with compatible people in your area.",
      color: "bg-accent"
    },
    {
      step: "03",
      title: "Start Anonymous",
      description: "Begin chatting anonymously to reduce pressure and focus on genuine connection.",
      color: "bg-primary-glow"
    },
    {
      step: "04",
      title: "Reveal & Connect",
      description: "Share profiles when you're ready. Meet up, collaborate, or stay digital friends.",
      color: "bg-gradient-secondary"
    }
  ];

  return (
    <section className="py-24 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="text-primary font-medium px-4 py-2 mb-6">
            🔄 Simple Process
          </Badge>
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">
            How <span className="bg-gradient-primary bg-clip-text text-transparent">It Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From sharing your vibe to making real connections - it's designed to feel natural and exciting.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connection line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent z-0"></div>
              )}
              
              <Card className="relative z-10 text-center hover:shadow-card transition-all duration-300 hover:-translate-y-2 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${step.color} text-primary-foreground font-bold text-lg mb-6 shadow-glow`}>
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 bg-muted/30 backdrop-blur-sm px-8 py-4 rounded-full">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-8 h-8 rounded-full bg-gradient-primary border-2 border-background ${i === 2 ? 'z-10 scale-110' : ''}`}
                ></div>
              ))}
            </div>
            <span className="text-sm font-medium">Join 10,000+ early users</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;