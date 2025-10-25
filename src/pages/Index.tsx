import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logo from "@/assets/next-wife-logo-squared.jpeg";

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
      {/* Hero Section with Video Background */}
      <header className="relative h-screen flex flex-col justify-end overflow-hidden pb-12">
        {/* Top Navigation Bar */}
        {/* Next Wife Title - Left */}
        <div className="absolute top-8 left-8 z-20">
          <h1 className="text-white text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            Next Wife
          </h1>
        </div>

        {/* Logo Profile Button - Right */}
        <button
          onClick={() => window.open('https://t.me/nextwifebot', '_blank')}
          className="absolute top-8 right-8 z-20 hover:scale-110 transition-transform duration-300"
        >
          <img 
            src={logo} 
            alt="Next Wife Profile" 
            className="w-12 h-12 rounded-full object-cover shadow-lg cursor-pointer" 
            style={{ boxShadow: 'var(--shadow-glow)' }} 
          />
        </button>

        {/* Video Background */}
        <div className="absolute inset-0 grid grid-cols-4 opacity-30">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover">
            <source src="/videos/video-2-loop.mp4" type="video/mp4" />
          </video>
          <video autoPlay muted loop playsInline className="w-full h-full object-cover">
            <source src="/videos/video-3-loop.mp4" type="video/mp4" />
          </video>
          <video autoPlay muted loop playsInline className="w-full h-full object-cover">
            <source src="/videos/video-4-loop.mp4" type="video/mp4" />
          </video>
          <video autoPlay muted loop playsInline className="w-full h-full object-cover">
            <source src="/videos/video-5-loop.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Content Overlaying Bottom of Videos */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Your Bali Paradise Awaits
          </p>
          
          <p className="text-lg md:text-xl text-white/90 mb-6 max-w-3xl mx-auto leading-relaxed">
            Live in a luxurious ocean-front palace with the girlfriend you create, where unique stories meet tropical elegance
          </p>
          
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 font-bold transition-all duration-300"
            style={{ 
              background: 'var(--gradient-sunset)',
              boxShadow: 'var(--shadow-warm)'
            }}
            onClick={() => window.open('https://t.me/nextwifebot', '_blank')}
          >
            Create Your Next Wife
          </Button>
        </div>
      </header>

      {/* Features and Logo Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
