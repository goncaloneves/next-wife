import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const privacyPoints = [
  { icon: "👻", key: "noAccount" },
  { icon: "🔇", key: "noLogs" },
  { icon: "💳", key: "payment" },
  { icon: "📱", key: "noApp" },
];

export const PrivacySection = () => {
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
      const items = sectionRef.current.querySelectorAll(".privacy-item");
      items.forEach((item) => observer.observe(item));
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative w-full bg-gradient-to-b from-black via-[#0a0d1a] to-black py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading mb-3 text-white">
            {t("home.privacy.title")}
          </h2>
          <p className="text-white/70 text-lg mb-10">
            {t("home.privacy.subtitle")}
          </p>

          <div ref={sectionRef} className="space-y-5">
            {privacyPoints.map((point, index) => (
              <div
                key={point.key}
                className="privacy-item opacity-0 flex items-center gap-4 text-left px-6 py-4 rounded-xl bg-white/[0.07] backdrop-blur-md"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <span className="text-2xl shrink-0">{point.icon}</span>
                <span className="text-white/90 text-[15px] font-medium">
                  {t(`home.privacy.points.${point.key}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
