import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TelegramQRWidgetProps {
  onClose: () => void;
}

export const TelegramQRWidget = ({ onClose }: TelegramQRWidgetProps) => {
  const botLink = "https://t.me/nextwifebot";

  return (
    <Card className="fixed bottom-24 right-6 w-80 p-6 shadow-2xl z-50 border-2 animate-in fade-in slide-in-from-bottom-5 duration-300">
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-2 right-2 h-8 w-8"
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Content */}
      <div className="flex flex-col items-center gap-4 pt-2">
        <h3 className="text-lg font-semibold text-center">
          Scan to Open Bot
        </h3>
        
        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg">
          <QRCodeSVG 
            value={botLink} 
            size={200}
            level="M"
            includeMargin={false}
          />
        </div>

        {/* Bot Username */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Or open directly:
          </p>
          <a
            href={botLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            @nextwifebot
          </a>
        </div>
      </div>
    </Card>
  );
};
