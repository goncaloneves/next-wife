import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Phone, KeyRound, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { sendCode, signIn, checkPassword } from "@/lib/telegramApi";

interface TelegramAuthProps {
  onAuthenticated: (sessionString: string) => void;
}

type AuthStage = "phone" | "code" | "password";

export const TelegramAuth = ({ onAuthenticated }: TelegramAuthProps) => {
  const [authStage, setAuthStage] = useState<AuthStage>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await sendCode(phoneNumber);
      setPhoneCodeHash(result.phoneCodeHash);
      setAuthStage("code");
      toast({
        title: "Code Sent",
        description: "Check your Telegram app for the verification code.",
      });
    } catch (err: any) {
      console.error("Error sending code:", err);
      setError(err.message || "Failed to send code. Please check your phone number.");
      toast({
        title: "Error",
        description: "Failed to send code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn(phoneNumber, code, phoneCodeHash);
      
      if (result.requires2FA) {
        setAuthStage("password");
        toast({
          title: "2FA Required",
          description: "Please enter your 2FA password.",
        });
      } else {
        toast({
          title: "Success",
          description: "Successfully authenticated!",
        });
        onAuthenticated(result.sessionString);
      }
    } catch (err: any) {
      console.error("Error verifying code:", err);
      setError("Invalid code. Please try again.");
      toast({
        title: "Error",
        description: "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const sessionString = await checkPassword(password);
      toast({
        title: "Success",
        description: "Successfully authenticated!",
      });
      onAuthenticated(sessionString);
    } catch (err: any) {
      console.error("Error verifying password:", err);
      setError("Incorrect password. Please try again.");
      toast({
        title: "Error",
        description: "Incorrect password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="p-6 space-y-4">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-xl">Login to Telegram</CardTitle>
        <p className="text-sm text-muted-foreground">
          {authStage === "phone" && "Enter your phone number to receive a verification code"}
          {authStage === "code" && "Enter the code sent to your Telegram app"}
          {authStage === "password" && "Enter your 2FA password"}
        </p>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        {authStage === "phone" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium">Phone Number</label>
              </div>
              <Input
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleSendCode)}
                disabled={isLoading}
                className="text-base"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              onClick={handleSendCode}
              disabled={isLoading || !phoneNumber.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Code"
              )}
            </Button>
          </div>
        )}

        {authStage === "code" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium">Verification Code</label>
              </div>
              <Input
                type="text"
                placeholder="12345"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyPress={(e) => handleKeyPress(e, handleVerifyCode)}
                disabled={isLoading}
                maxLength={5}
                className="text-base text-center text-2xl tracking-widest"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              onClick={handleVerifyCode}
              disabled={isLoading || !code.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setAuthStage("phone");
                setCode("");
                setError(null);
              }}
              disabled={isLoading}
              className="w-full"
            >
              Back to Phone Number
            </Button>
          </div>
        )}

        {authStage === "password" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium">2FA Password</label>
              </div>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleVerifyPassword)}
                disabled={isLoading}
                className="text-base"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              onClick={handleVerifyPassword}
              disabled={isLoading || !password.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Password"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </div>
  );
};
