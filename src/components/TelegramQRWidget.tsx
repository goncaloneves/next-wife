import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";

interface TelegramQRWidgetProps {
  onClose: () => void;
}

export const TelegramQRWidget = ({ onClose }: TelegramQRWidgetProps) => {
  const qrCodeUrl = "https://nextwife.ai/discover?view=app";

  return (
    <Link
      to="/discover"
      className="hidden md:block absolute bottom-6 right-6 bg-white p-3 rounded-2xl shadow-2xl z-20 animate-in fade-in duration-300 hover:scale-110 transition-transform duration-300 cursor-pointer"
      onClick={(e) => e.stopPropagation()}
    >
      <QRCodeSVG 
        value={qrCodeUrl} 
        size={80}
        level="M"
        includeMargin={false}
        className="w-14 h-14 lg:w-20 lg:h-20"
      />
    </Link>
  );
};
