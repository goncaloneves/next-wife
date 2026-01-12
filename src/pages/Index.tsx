import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logo from "@/assets/next-wife-logo-sunset.jpeg";
import { TelegramQRWidget } from "@/components/TelegramQRWidget";
import { TelegramChannelFeed } from "@/components/TelegramChannelFeed";
import { DiscoverFilterModal, DiscoverFilterButton } from "@/components/DiscoverFilterModal";
import { useFilters } from "@/contexts/FilterContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { filters, setFilters, activeFilterCount } = useFilters();
  const [isQRVisible, setIsQRVisible] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  const featuresRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const feedContentRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
          }
        });
      },
      { threshold: 0.1 },
    );

    if (heroRef.current) observer.observe(heroRef.current);
    if (featuresRef.current) {
      const cards = featuresRef.current.querySelectorAll(".feature-card");
      cards.forEach((card) => observer.observe(card));
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const state = location.state as { restoreScroll?: boolean } | null;
    if (state?.restoreScroll) {
      // Scroll restoration is handled by TelegramChannelFeed when restoring from cache
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Pause/play background videos based on hero section visibility
  useEffect(() => {
    if (!heroRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          videoRefs.current.forEach((video) => {
            if (video) {
              if (entry.isIntersecting) {
                video.play().catch(() => {});
              } else {
                video.pause();
              }
            }
          });
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: "🌺",
      title: "Authentic Daily Life",
      description: "Experience genuine moments and authentic interactions in her daily life",
    },
    {
      icon: "🥂",
      title: "Discover New Relationships",
      description: "Create multiple unique girlfriends and explore different connections",
    },
    {
      icon: "💖",
      title: "Romantic Moments",
      description: "Discover intimate conversations and build meaningful connections",
    },
    {
      icon: "📸",
      title: "Photo, Voice & Video",
      description: "Engage with photos, voice messages and videos for deeper connections",
    },
    {
      icon: "🔥",
      title: "Secret Stories",
      description: "Uncover hidden desires and exclusive intimate moments",
    },
    {
      icon: "🤩",
      title: "Earn Telegram Stars",
      description: "Earn 20% lifetime commission with our affiliate program",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Fixed Video Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-4 opacity-30">
          {!isMobile && (
            <video
              ref={(el) => { videoRefs.current[0] = el; }}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-full object-cover opacity-0 animate-fade-in"
              style={{ animationDelay: "0s", animationFillMode: "forwards" }}
            >
              <source src="/videos/video-2-loop.mp4" type="video/mp4" />
            </video>
          )}
          <video
            ref={(el) => { videoRefs.current[1] = el; }}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="w-full h-full object-cover opacity-0 animate-fade-in"
            style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
          >
            <source src="/videos/video-3-loop.mp4" type="video/mp4" />
          </video>
          <video
            ref={(el) => { videoRefs.current[2] = el; }}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="w-full h-full object-cover opacity-0 animate-fade-in"
            style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
          >
            <source src="/videos/video-4-loop.mp4" type="video/mp4" />
          </video>
          {!isMobile && (
            <video
              ref={(el) => { videoRefs.current[3] = el; }}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-full object-cover opacity-0 animate-fade-in"
              style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
            >
              <source src="/videos/video-5-loop.mp4" type="video/mp4" />
            </video>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <header
          ref={heroRef}
          className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden opacity-0"
          style={{ paddingBottom: 'max(3rem, calc(env(safe-area-inset-bottom) + 2rem))' }}
        >
          {/* Top Navigation Bar */}
          <div 
            className="absolute left-8 z-20 flex items-center gap-4"
            style={{ top: 'max(2rem, calc(env(safe-area-inset-top) + 1rem))' }}
          >
            {/* Logo - Left */}
            <img
              src={logo}
              alt="Next Wife"
              className="w-12 h-12 rounded-full object-cover shadow-lg"
              style={{ boxShadow: "var(--shadow-glow)" }}
            />

            {/* Next Wife Title */}
            <h1
              className="text-white text-4xl font-bold"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Next Wife
            </h1>
          </div>

          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black"></div>

          {/* Hero Content */}
          <div className="relative z-10 container mx-auto px-4 text-center">
            <p className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Create your wife on Telegram
            </p>

            <p className="text-lg md:text-2xl text-white/90 mb-6 max-w-2xl mx-auto leading-relaxed font-bold">
              Meet the woman you create and embark on a romantic journey, sharing unique stories from around the globe.
            </p>

            <div className="flex flex-col items-center gap-3">
              <Button
                size="lg"
                className="text-lg px-8 py-6 font-bold transition-all duration-300 hover:brightness-110 active:scale-95"
                style={{
                  background: "var(--gradient-sunset-muted)",
                  boxShadow: "var(--shadow-warm)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 6px 30px rgba(198, 58, 75, 0.4), 0 0 50px rgba(232, 115, 85, 0.25)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "var(--shadow-warm)"}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    window.location.href = '/discover';
                  } else {
                    feedContentRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                data-testid="button-pick-your-woman"
              >
                Find Your Woman 🌻
              </Button>
              <button
                className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-200 underline underline-offset-4 decoration-white/30 hover:decoration-white/60"
                onClick={() => window.open("https://t.me/nextwifebot?start=now", "_blank")}
                data-testid="button-create-telegram"
              >
                or create your own on Telegram
              </button>
            </div>
          </div>

          {/* QR Code positioned in bottom right of video section */}
          {isQRVisible && <TelegramQRWidget onClose={() => setIsQRVisible(false)} />}
        </header>

        {/* Features Section - Scrolls over the fixed background */}
        <section className="relative w-full bg-black py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Title */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading mb-8 text-center text-white">
              Your Girlfriend Experience ✨
            </h2>
            
            {/* Features Grid */}
            <div ref={featuresRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="feature-card relative p-6 rounded-2xl opacity-0 bg-black/40 backdrop-blur-md"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 40px rgba(198, 58, 75, 0.3), 0 0 60px rgba(232, 115, 85, 0.15)",
                  }}
                >
                  {/* Card Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="mb-4">
                      <div
                        className="w-24 h-24 flex items-center justify-center text-5xl"
                      >
                        {feature.icon}
                      </div>
                    </div>
                    
                    {/* Text Content */}
                    <h3 className="text-lg font-bold mb-2 text-white">
                      {feature.title}
                    </h3>
                    <p className="text-[15px] text-white/70 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

        {/* Telegram Channel Feed Section - Scrolls over the fixed background */}
        <section ref={feedContentRef} className="hidden md:block relative py-12 bg-black">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex-1" />
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading text-center text-white whitespace-nowrap">
                  Find Your Woman 🌻
                </h2>
                <div className="flex-1 flex justify-end">
                  <DiscoverFilterButton 
                    onClick={() => setShowFilters(!showFilters)} 
                    activeCount={activeFilterCount}
                  />
                </div>
              </div>
              <DiscoverFilterModal
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                channel="nextwife_ai"
                filters={filters}
                onFiltersChange={setFilters}
              />
              <TelegramChannelFeed 
                channelUsername="nextwifeai" 
                layout="grid" 
                feedSectionRef={feedContentRef}
                filters={filters}
              />
            </div>
          </div>
        </section>

        {/* Footer - Scrolls over the fixed background */}
        <footer className="bg-black py-8 text-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-4 text-white/70 font-body text-sm">
              <Link 
                to="/terms" 
                className="hover:text-white transition-colors"
                data-testid="link-terms"
              >
                Terms & Conditions
              </Link>
              <span>•</span>
              <Link 
                to="/privacy" 
                className="hover:text-white transition-colors"
                data-testid="link-privacy"
              >
                Privacy Policy
              </Link>
              <span>•</span>
              <a
                href="https://t.me/nextwifesupport"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                data-testid="link-support"
              >
                Support
              </a>
            </div>
            <p className="text-white/70 font-body text-sm">
              <span
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open("https://t.me/nextwifebot?start=now", "_blank")}
              >
                @nextwifebot
              </span>
              {" "}- Made with 💖
            </p>
          </div>
        </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
