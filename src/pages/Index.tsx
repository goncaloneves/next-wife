import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logoChili from "@/assets/next-wife-chili.svg";
import logoText from "@/assets/next-wife-text.svg";
import { TelegramQRWidget } from "@/components/TelegramQRWidget";
import { TelegramChannelFeed } from "@/components/TelegramChannelFeed";
import { DiscoverFilterModal, DiscoverFilterButton } from "@/components/DiscoverFilterModal";
import { LanguagePicker } from "@/components/LanguagePicker";
import { useFilters } from "@/contexts/FilterContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { filters, setFilters, activeFilterCount } = useFilters();
  const [isQRVisible, setIsQRVisible] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  const featuresRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const feedContentRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const isMobile = useIsMobile();
  
  const handleProfileOverlay = useCallback((postId: string) => {
    navigate(`/profile/${postId}`, {
      state: { backgroundLocation: location, isOverlay: true }
    });
  }, [navigate, location]);

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
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
      title: t('home.features.authenticDailyLife.title'),
      description: t('home.features.authenticDailyLife.description'),
    },
    {
      icon: "🥂",
      title: t('home.features.discoverNewRelationships.title'),
      description: t('home.features.discoverNewRelationships.description'),
    },
    {
      icon: "💖",
      title: t('home.features.romanticMoments.title'),
      description: t('home.features.romanticMoments.description'),
    },
    {
      icon: "📸",
      title: t('home.features.photoVoiceVideo.title'),
      description: t('home.features.photoVoiceVideo.description'),
    },
    {
      icon: "🔥",
      title: t('home.features.secretStories.title'),
      description: t('home.features.secretStories.description'),
    },
    {
      icon: "🤩",
      title: t('home.features.earnTelegramStars.title'),
      description: t('home.features.earnTelegramStars.description'),
    },
  ];

  return (
    <div className="min-h-screen">
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

      <div className="relative z-10">
        <header
          ref={heroRef}
          className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden opacity-0"
          style={{ paddingBottom: 'max(3rem, calc(env(safe-area-inset-bottom) + 2rem))' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black"></div>

          <div className="relative z-10 container mx-auto px-4 text-center">
            <h1 className="mb-6 flex justify-center">
              <span className="sr-only">Meet Your Next Wife — AI Companion on Telegram</span>
              <div className="relative">
                <img
                  src={logoChili}
                  alt=""
                  aria-hidden="true"
                  className="absolute right-full top-[44%] -translate-y-1/2 h-16 md:h-20 lg:h-24 w-auto pr-3"
                  style={{ filter: 'drop-shadow(rgba(0, 0, 0, 0.5) 0px 2px 14px)' }}
                />
                <img
                  src={logoText}
                  alt="nextwife — Meet Your Next Wife"
                  className="h-24 md:h-32 lg:h-40 w-auto"
                  style={{ filter: 'drop-shadow(rgba(0, 0, 0, 0.5) 0px 2px 16px)' }}
                />
              </div>
            </h1>

            <p className="text-lg md:text-2xl text-white/90 mb-6 max-w-2xl md:max-w-4xl mx-auto leading-relaxed font-bold">
              {(() => {
                const text = t('home.heroSubtitle');
                const split = text.indexOf('. ');
                if (split === -1) return text;
                return <>{text.slice(0, split + 1)}<br />{text.slice(split + 2)}</>;
              })()}
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
                    window.location.href = '/find';
                  } else {
                    feedContentRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                data-testid="button-pick-your-woman"
              >
                {t('home.findYourWoman')}
              </Button>
              <button
                className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-200 underline underline-offset-4 decoration-white/30 hover:decoration-white/60"
                onClick={() => window.open("https://t.me/nextwifebot?start=now", "_blank")}
                data-testid="button-create-telegram"
              >
                {t('home.orCreateOnTelegram')}
              </button>
            </div>
          </div>

          {isQRVisible && <TelegramQRWidget onClose={() => setIsQRVisible(false)} />}
        </header>

        <section className="relative w-full bg-black py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading mb-8 text-center text-white">
              {t('home.yourGirlfriendExperience')}
            </h2>
            
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
                  <div className="relative z-10">
                    <div className="mb-4">
                      <div
                        className="w-24 h-24 flex items-center justify-center text-5xl"
                      >
                        {feature.icon}
                      </div>
                    </div>
                    
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

        <section className="relative w-full bg-black py-14">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading mb-3 text-center text-white">
                {t('home.relationshipTypes.title')}
              </h2>
              <p className="text-white/60 text-center mb-8 text-lg">
                {t('home.relationshipTypes.subtitle')}
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { icon: "🤝", key: "stranger" },
                  { icon: "📚", key: "classmate" },
                  { icon: "💼", key: "coworker" },
                  { icon: "💛", key: "bestFriend" },
                  { icon: "💖", key: "girlfriend" },
                  { icon: "💒", key: "wife" },
                ].map((rt) => (
                  <div
                    key={rt.key}
                    className="relative p-6 rounded-2xl bg-black/40 backdrop-blur-md"
                    style={{
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 40px rgba(198, 58, 75, 0.3), 0 0 60px rgba(232, 115, 85, 0.15)",
                    }}
                  >
                    <div className="relative z-10">
                      <div className="text-4xl mb-3">{rt.icon}</div>
                      <h3 className="text-lg font-bold mb-2 text-white">
                        {t(`home.relationshipTypes.${rt.key}.title`)}
                      </h3>
                      <p className="text-[15px] text-white/70 leading-relaxed">
                        {t(`home.relationshipTypes.${rt.key}.description`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section ref={feedContentRef} className="hidden md:block relative py-12 bg-black">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex-1" />
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading text-center text-white whitespace-nowrap">
                  {t('home.findYourWoman')} 💍
                </h2>
                <div className="flex-1 flex justify-end items-center gap-1">
                  <DiscoverFilterButton 
                    onClick={() => setShowFilters(!showFilters)} 
                    activeCount={activeFilterCount}
                  />
                  <LanguagePicker />
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
                onProfileOverlay={handleProfileOverlay}
                hideNotifications={location.pathname.startsWith('/profile/')}
              />
            </div>
          </div>
        </section>

        <footer className="bg-black py-8 text-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-4 text-white/70 font-body text-sm">
              <Link 
                to="/terms" 
                className="hover:text-white transition-colors"
                data-testid="link-terms"
              >
                {t('navigation.termsAndConditions')}
              </Link>
              <span>•</span>
              <Link 
                to="/privacy" 
                className="hover:text-white transition-colors"
                data-testid="link-privacy"
              >
                {t('navigation.privacyPolicy')}
              </Link>
              <span>•</span>
              <a
                href="https://t.me/nextwifesupport"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                data-testid="link-support"
              >
                {t('common.support')}
              </a>
            </div>
            <p className="text-white/70 font-body text-sm">
              <span
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open("https://t.me/nextwifebot?start=now", "_blank")}
              >
                @nextwifebot
              </span>
              {" "}- {t('common.madeWith')}
            </p>
          </div>
        </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
