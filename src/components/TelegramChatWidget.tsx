import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, MessageCircle } from "lucide-react";
import { TelegramAuth } from "@/components/TelegramAuth";
import { TelegramMessenger } from "@/components/TelegramMessenger";
import { restoreSession } from "@/lib/telegramApi";

interface TelegramChatWidgetProps {
  onClose: () => void;
}

export const TelegramChatWidget = ({ onClose }: TelegramChatWidgetProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const savedSession = localStorage.getItem("telegram_session");
      
      if (savedSession) {
        try {
          await restoreSession(savedSession);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Failed to restore session:", error);
          localStorage.removeItem("telegram_session");
        }
      }
      
      setIsCheckingSession(false);
    };

    checkSession();
  }, []);

  const handleAuthenticated = (sessionString: string) => {
    localStorage.setItem("telegram_session", sessionString);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("telegram_session");
    setIsAuthenticated(false);
  };

  if (isCheckingSession) {
    return (
      <Card className="fixed bottom-24 right-6 w-96 h-[500px] flex items-center justify-center shadow-2xl z-50 border-2">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm text-muted-foreground">Checking session...</p>
        </div>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="fixed bottom-24 right-6 w-96 h-[500px] flex flex-col shadow-2xl z-50 border-2">
        <TelegramAuth onAuthenticated={handleAuthenticated} />
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-24 right-6 w-96 h-[500px] flex flex-col shadow-2xl z-50 border-2">
      <TelegramMessenger onLogout={handleLogout} onClose={onClose} />
    </Card>
  );
};
