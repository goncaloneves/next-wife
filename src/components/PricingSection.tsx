import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const plans = [
  {
    key: "free",
    emoji: "🆓",
    price: 0,
    popular: false,
    features: { wives: 1, texts: 20, images: 2, voice: 2, videos: 1 },
  },
  {
    key: "flirt",
    emoji: "💕",
    price: 500,
    popular: false,
    features: { wives: 1, texts: Infinity, images: 15, voice: 10, videos: 3 },
  },
  {
    key: "lover",
    emoji: "❤️‍🔥",
    price: 1000,
    popular: true,
    features: { wives: 3, texts: Infinity, images: 50, voice: 25, videos: 8 },
  },
  {
    key: "obsessed",
    emoji: "🌶️",
    price: 2500,
    popular: false,
    features: { wives: 5, texts: Infinity, images: 150, voice: 75, videos: 20 },
  },
];

export const PricingSection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);

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

    if (sectionRef.current) {
      const cards = sectionRef.current.querySelectorAll(".pricing-card");
      cards.forEach((card) => observer.observe(card));
    }

    return () => observer.disconnect();
  }, []);

  const featureRow = (label: string, value: number) => (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-white/60 text-sm">{label}</span>
      <span className="text-white font-semibold text-sm">
        {value === Infinity ? t("home.pricing.features.unlimited") : value}
      </span>
    </div>
  );

  return (
    <section className="relative w-full bg-black py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading mb-3 text-center text-white">
            {t("home.pricing.title")}
          </h2>
          <p className="text-white/60 text-center mb-8 text-lg">
            {t("home.pricing.subtitle")}
          </p>

          <div
            ref={sectionRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {plans.map((plan, index) => (
              <div
                key={plan.key}
                className={`pricing-card relative p-6 rounded-2xl opacity-0 backdrop-blur-md flex flex-col ${
                  plan.popular ? "bg-white/10" : "bg-black/40"
                }`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  boxShadow: plan.popular
                    ? "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 50px rgba(198, 58, 75, 0.4), 0 0 80px rgba(232, 115, 85, 0.2)"
                    : "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 40px rgba(198, 58, 75, 0.3), 0 0 60px rgba(232, 115, 85, 0.15)",
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: "var(--gradient-sunset)" }}
                  >
                    {t("home.pricing.popular")}
                  </div>
                )}

                <div className="relative z-10 flex flex-col flex-1">
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-2">{plan.emoji}</div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {t(`home.pricing.plans.${plan.key}.name`)}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      {plan.price === 0 ? (
                        <span className="text-3xl font-bold text-white">
                          {t("home.pricing.plans.free.price")}
                        </span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-white">
                            {plan.price}
                          </span>
                          <span className="text-lg">⭐</span>
                          <span className="text-white/50 text-sm">
                            {t("home.pricing.monthly")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 mb-4 flex-1">
                    {featureRow(
                      plan.features.wives === 1
                        ? t("home.pricing.features.wife")
                        : t("home.pricing.features.wives"),
                      plan.features.wives,
                    )}
                    {featureRow(
                      t("home.pricing.features.texts"),
                      plan.features.texts,
                    )}
                    {featureRow(
                      t("home.pricing.features.images"),
                      plan.features.images,
                    )}
                    {featureRow(
                      t("home.pricing.features.voice"),
                      plan.features.voice,
                    )}
                    {featureRow(
                      t("home.pricing.features.videos"),
                      plan.features.videos,
                    )}
                    <div className="flex items-center gap-2 pt-3 mt-1 border-t border-white/10">
                      <span className="text-green-400 text-sm">✓</span>
                      <span className="text-white/80 text-sm font-medium">{t("home.pricing.features.catalogWives")}</span>
                    </div>
                  </div>

                  <a
                    href="https://t.me/nextwifebot?start=now"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-3 rounded-xl font-bold text-white transition-all duration-300 hover:brightness-110 active:scale-95"
                    style={{
                      background: plan.popular
                        ? "var(--gradient-sunset)"
                        : "rgba(255, 255, 255, 0.1)",
                      boxShadow: plan.popular
                        ? "var(--shadow-warm)"
                        : "none",
                    }}
                  >
                    {t(`home.pricing.plans.${plan.key}.cta`)}
                  </a>
                </div>
              </div>
            ))}
          </div>

          <p className="text-white/30 text-center mt-6 text-sm">
            {t("home.pricing.note")}
          </p>
        </div>
      </div>
    </section>
  );
};
