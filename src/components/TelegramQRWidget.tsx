import { QRCodeSVG } from "qrcode.react";

interface TelegramQRWidgetProps {
  onClose: () => void;
}

export const TelegramQRWidget = ({ onClose }: TelegramQRWidgetProps) => {
  const botLink = "https://t.me/nextwifebot";

  return (
    <a
      href={botLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 bg-white p-3 rounded-2xl shadow-2xl z-50 animate-in fade-in duration-300 hover:scale-105 transition-transform cursor-pointer"
      onClick={(e) => e.stopPropagation()}
    >
      <QRCodeSVG 
        value={botLink} 
        size={120}
        level="M"
        includeMargin={false}
      />
    </a>
  );
};
