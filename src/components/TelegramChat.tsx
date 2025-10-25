import { useEffect, useRef } from "react";

const TelegramChat = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create the Telegram widget container
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-discussion", "nextwifebot");
    script.setAttribute("data-comments-limit", "5");
    script.setAttribute("data-colorful", "1");
    script.setAttribute("data-color", "E91E63");
    script.setAttribute("data-dark-color", "F48FB1");
    script.async = true;

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div 
        ref={containerRef}
        className="rounded-lg overflow-hidden backdrop-blur-sm bg-card/60 border border-border p-6 shadow-lg"
        style={{ boxShadow: 'var(--shadow-warm)' }}
      />
    </div>
  );
};

export default TelegramChat;
