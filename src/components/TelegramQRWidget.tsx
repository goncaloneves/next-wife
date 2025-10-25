import { QRCodeSVG } from "qrcode.react";

interface TelegramQRWidgetProps {
  onClose: () => void;
}

export const TelegramQRWidget = ({ onClose }: TelegramQRWidgetProps) => {
  const botLink = "https://t.me/nextwifebot";

  return (
    <div className="absolute bottom-6 right-6 z-50 flex flex-col items-center gap-2 animate-fade-in">
      {/* Text Message */}
      <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
        <p className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap">
          Scan with your phone! 📱
        </p>
      </div>

      {/* Curved Arrow SVG */}
      <svg
        width="40"
        height="45"
        viewBox="0 0 40 45"
        className="animate-bounce"
        style={{ animationDuration: '2s' }}
      >
        <defs>
          <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(350 75% 45%)" />
            <stop offset="100%" stopColor="hsl(25 85% 55%)" />
          </linearGradient>
        </defs>
        <path
          d="M 20 5 Q 15 15, 20 25 Q 25 35, 20 40"
          stroke="url(#arrowGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 20 40 L 15 35 M 20 40 L 25 35"
          stroke="url(#arrowGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* QR Code */}
      <a
        href={botLink}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white p-3 rounded-2xl shadow-2xl hover:scale-110 transition-transform duration-300 cursor-pointer"
        style={{ boxShadow: 'var(--shadow-glow)' }}
        onClick={(e) => e.stopPropagation()}
        aria-label="Scan QR code to chat with Next Wife bot on Telegram"
      >
        <QRCodeSVG 
          value={botLink} 
          size={80}
          level="M"
          includeMargin={false}
          className="w-16 h-16 sm:w-20 sm:h-20"
        />
      </a>
    </div>
  );
};
