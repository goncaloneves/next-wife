import { QRCodeSVG } from "qrcode.react";

interface TelegramQRWidgetProps {
  onClose: () => void;
}

export const TelegramQRWidget = ({ onClose }: TelegramQRWidgetProps) => {
  const botLink = "https://t.me/nextwifebot";

  return (
    <div className="absolute bottom-6 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 lg:bottom-8 lg:right-10 z-50 animate-fade-in">
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
