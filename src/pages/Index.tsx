import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logo from "@/assets/next-wife-logo-squared.jpeg";
import { TelegramQRWidget } from "@/components/TelegramQRWidget";
import { TelegramChannelFeed } from "@/components/TelegramChannelFeed";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [isQRVisible, setIsQRVisible] = useState(true);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const feedVideoRef = useRef<HTMLDivElement>(null);
  const feedContentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) observer.observe(heroRef.current);
    if (featuresRef.current) {
      const cards = featuresRef.current.querySelectorAll('.feature-card');
      cards.forEach((card) => observer.observe(card));
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVideoVisible(true);
            // Add animation class to feed video wrapper and content
            if (entry.target.classList.contains('feed-video-wrapper')) {
              entry.target.classList.add('animate-fade-in');
            }
            if (entry.target.classList.contains('feed-content-wrapper')) {
              entry.target.classList.add('animate-fade-in');
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    if (feedVideoRef.current) observer.observe(feedVideoRef.current);
    if (feedContentRef.current) observer.observe(feedContentRef.current);

    return () => observer.disconnect();
  }, []);
  
  const features = [
    {
      icon: "🌺",
      title: "Authentic Daily Life",
      description: "Experience genuine moments in your Bali tropical paradise"
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
      <header ref={heroRef} className="relative h-screen flex flex-col justify-end overflow-hidden pb-12 opacity-0">
        {/* Top Navigation Bar */}
        <div className="absolute top-8 left-8 z-20 flex items-center gap-4">
          {/* Logo Profile Button - Left */}
          <button
            onClick={() => window.open('https://t.me/nextwifebot', '_blank')}
            className="hover:scale-110 transition-transform duration-300"
          >
            <img 
              src={logo} 
              alt="Next Wife Profile" 
              className="w-12 h-12 rounded-full object-cover shadow-lg cursor-pointer" 
              style={{ boxShadow: 'var(--shadow-glow)' }} 
            />
          </button>

          {/* Next Wife Title */}
          <h1 
            className="text-white text-4xl font-bold cursor-pointer hover:opacity-80 transition-opacity duration-300" 
            style={{ fontFamily: 'var(--font-heading)' }}
            onClick={() => window.open('https://t.me/nextwifebot', '_blank')}
          >
            Next Wife
          </h1>
        </div>

        {/* Video Background */}
        <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-4 opacity-30">
          {!isMobile && (
            <video autoPlay muted loop playsInline preload="metadata" className="w-full h-full object-cover opacity-0 animate-fade-in" style={{ animationDelay: '0s', animationFillMode: 'forwards' }}>
              <source src="/videos/video-2-loop.mp4" type="video/mp4" />
            </video>
          )}
          <video autoPlay muted loop playsInline preload="metadata" className="w-full h-full object-cover opacity-0 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <source src="/videos/video-3-loop.mp4" type="video/mp4" />
          </video>
          <video autoPlay muted loop playsInline preload="metadata" className="w-full h-full object-cover opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <source src="/videos/video-4-loop.mp4" type="video/mp4" />
          </video>
          {!isMobile && (
            <video autoPlay muted loop playsInline preload="metadata" className="w-full h-full object-cover opacity-0 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
              <source src="/videos/video-5-loop.mp4" type="video/mp4" />
            </video>
          )}
        </div>

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70"></div>

        {/* Content Overlaying Bottom of Videos */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <p className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Create your girlfriend on Telegram
          </p>
          
          <p className="text-base md:text-xl text-white/90 mb-6 max-w-2xl mx-auto leading-relaxed font-bold">
            Live in a luxurious ocean-front palace in Bali with the girlfriend you want, where unique stories meet tropical elegance.
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
            Open Next Wife 🌻
          </Button>
        </div>

        {/* QR Code positioned in bottom right of video section */}
        {isQRVisible && <TelegramQRWidget onClose={() => setIsQRVisible(false)} />}
      </header>

      {/* Features and Logo Section */}
      <section className="relative w-full bg-gradient-to-b from-black/70 via-black/30 to-transparent py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
          {/* Features Grid */}
          <div ref={featuresRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="feature-card p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 bg-card/80 backdrop-blur border border-border hover:border-primary/60 cursor-pointer opacity-0"
                style={{ 
                  boxShadow: 'var(--shadow-warm)',
                  animationDelay: `${index * 0.1}s`
                }}
                onClick={() => window.open('https://t.me/nextwifebot', '_blank')}
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-5xl" style={{ background: 'var(--gradient-sunset)' }}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-base text-muted-foreground leading-snug line-clamp-2">{feature.description}</p>
              </Card>
            ))}
          </div>
          </div>
        </div>
        {/* Fade to full black at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-black pointer-events-none" />
      </section>

      {/* Telegram Channel Feed Section */}
      <section ref={videoSectionRef} className="relative min-h-screen flex items-center justify-center py-4 pb-20 bg-black overflow-hidden">
        {/* Video - Full Height, Left Edge with top and right fade */}
        <div ref={feedVideoRef} className="feed-video-wrapper absolute inset-y-0 left-0 w-1/2 hidden md:block video-fade-edges">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isVideoVisible ? 'opacity-30 animate-fade-in' : 'opacity-0'
            }`}
            style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
          >
            <source src="/videos/video-7-loop-3.mp4" type="video/mp4" />
          </video>
          {/* Black gradient overlay - intensifies fade on right edge to black */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/60 to-black pointer-events-none" />
        </div>

        {/* Content - Right Side */}
        <div className="relative z-10 container mx-auto px-0 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div ref={feedContentRef} className="feed-content-wrapper px-4 md:w-[55%] md:ml-auto opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading mb-12 text-center md:text-left text-white">
                Live from Bali 🏝️
              </h2>
              <TelegramChannelFeed channelUsername="nextwifeai" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t border-border">
        <p>
          © 2025 Next Wife{' '}
          <span 
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => window.open('https://t.me/nextwifebot', '_blank')}
          >
            @nextwifebot
          </span>
          . Made with 💖 in Bali.
        </p>
      </footer>

    </div>
  );
};

export default Index;
