import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Sparkles, Camera, MessageCircle, Video, ImageIcon } from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Authentic Daily Life",
      description: "Experience genuine moments and cultural exchanges in your tropical paradise"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Discover New Relationships",
      description: "Create multiple unique girlfriends and explore different connections"
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Romantic Moments",
      description: "Discover intimate conversations and build meaningful connections"
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Photo Interactions",
      description: "Share and receive beautiful photos in your journey together"
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: "Voice & Video",
      description: "Engage with voice messages and video content for deeper connection"
    },
    {
      icon: <ImageIcon className="w-8 h-8" />,
      title: "Secret Stories",
      description: "Uncover hidden desires and exclusive intimate moments"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-20 text-center">
        <div className="inline-block mb-6 px-6 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full border border-primary/30">
          <span className="text-sm font-medium text-primary">Your Bali Paradise Awaits 🌸</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
          Next Wife
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Live in a luxurious ocean-front palace with the girlfriend you create, where unique stories meet tropical elegance
        </p>
        
        <p className="text-lg text-foreground/80 mb-12 max-w-2xl mx-auto">
          Relationships evolve from cultural exchanges to intimate connections
        </p>
        
        <Button 
          size="lg" 
          className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all duration-300"
          onClick={() => window.open('https://t.me/your_bot_username', '_blank')}
        >
          Start Your Journey on Telegram
        </Button>
      </header>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 bg-card/50 backdrop-blur border-2 hover:border-primary/50"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 text-primary">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-3xl p-12 border-2 border-primary/20">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Every moment brings new possibilities 🌟
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start your journey in this world of passion and discover what awaits you
          </p>
          <Button 
            size="lg"
            className="text-lg px-10 py-6 bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all duration-300"
            onClick={() => window.open('https://t.me/your_bot_username', '_blank')}
          >
            Launch Next Wife Bot
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t border-border">
        <p>© 2025 Next Wife. Experience paradise like never before.</p>
      </footer>
    </div>
  );
};

export default Index;
