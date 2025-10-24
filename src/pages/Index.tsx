import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logo from "@/assets/next-wife-logo.jpeg";

const Index = () => {
  const features = [
    {
      icon: "🌺",
      title: "Authentic Daily Life",
      description: "Experience genuine moments and cultural exchanges in your tropical paradise"
    },
    {
      icon: "⭐",
      title: "Discover New Relationships",
      description: "Create multiple unique girlfriends and explore different connections"
    },
    {
      icon: "❤️",
      title: "Romantic Moments",
      description: "Discover intimate conversations and build meaningful connections"
    },
    {
      icon: "📸",
      title: "Photo Interactions",
      description: "Share and receive beautiful photos in your journey together"
    },
    {
      icon: "🎬",
      title: "Voice & Video",
      description: "Engage with voice messages and video content for deeper connection"
    },
    {
      icon: "🌟",
      title: "Secret Stories",
      description: "Uncover hidden desires and exclusive intimate moments"
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-romantic)' }}>
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-20 text-center">
        <div className="mb-8">
          <img src={logo} alt="Next Wife" className="w-64 h-64 mx-auto rounded-full object-cover shadow-2xl" style={{ boxShadow: 'var(--shadow-glow)' }} />
        </div>
        
        <div className="inline-block mb-6 px-6 py-2 bg-primary/20 rounded-full border border-primary/40 backdrop-blur-sm">
          <span className="text-sm font-medium text-accent">Your Bali Paradise Awaits 🌸</span>
        </div>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Live in a luxurious ocean-front palace with the girlfriend you create, where unique stories meet tropical elegance
        </p>
        
        <p className="text-lg text-foreground/80 mb-12 max-w-2xl mx-auto">
          Relationships evolve from cultural exchanges to intimate connections
        </p>
        
        <Button 
          size="lg" 
          className="text-lg px-8 py-6 transition-all duration-300"
          style={{ 
            background: 'var(--gradient-sunset)',
            boxShadow: 'var(--shadow-warm)'
          }}
          onClick={() => window.open('https://t.me/nextwifebot', '_blank')}
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
              className="p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 bg-card/80 backdrop-blur border border-border hover:border-primary/60"
              style={{ boxShadow: 'var(--shadow-warm)' }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-5xl" style={{ background: 'var(--gradient-sunset)' }}>
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
        <div className="max-w-3xl mx-auto bg-card/60 backdrop-blur-sm rounded-3xl p-12 border border-primary/30" style={{ boxShadow: 'var(--shadow-glow)' }}>
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Every moment brings new possibilities 🌟
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start your journey in this world of passion and discover what awaits you
          </p>
          <Button 
            size="lg"
            className="text-lg px-10 py-6 transition-all duration-300"
            style={{ 
              background: 'var(--gradient-sunset)',
              boxShadow: 'var(--shadow-warm)'
            }}
            onClick={() => window.open('https://t.me/nextwifebot', '_blank')}
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
