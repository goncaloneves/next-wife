import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { TelegramClient } from "npm:telegram@2.26.22";
import { StringSession } from "npm:telegram@2.26.22/sessions";
import { Api } from "npm:telegram@2.26.22/tl";
import bigInt from "npm:big-integer@1.6.52";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Store sessions in memory (in production, use a database)
const sessions = new Map<string, string>();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    const apiId = parseInt(Deno.env.get("VITE_TELEGRAM_API_ID") || "0");
    const apiHash = Deno.env.get("VITE_TELEGRAM_API_HASH") || "";

    if (!apiId || !apiHash) {
      throw new Error("Telegram API credentials not configured");
    }

    switch (action) {
      case "sendCode": {
        const { phoneNumber } = params;
        const session = new StringSession("");
        const client = new TelegramClient(session, apiId, apiHash, {
          connectionRetries: 5,
        });
        
        await client.connect();
        const result = await client.sendCode({ apiId, apiHash }, phoneNumber);
        
        return new Response(
          JSON.stringify({ phoneCodeHash: result.phoneCodeHash }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "signIn": {
        const { phoneNumber, code, phoneCodeHash, sessionId } = params;
        const sessionString = sessions.get(sessionId) || "";
        const session = new StringSession(sessionString);
        const client = new TelegramClient(session, apiId, apiHash, {
          connectionRetries: 5,
        });

        await client.connect();

        try {
          await client.invoke(
            new Api.auth.SignIn({
              phoneNumber,
              phoneCodeHash,
              phoneCode: code,
            })
          );

          const newSessionString = client.session.save() as unknown as string;
          sessions.set(sessionId, newSessionString);

          return new Response(
            JSON.stringify({ sessionString: newSessionString, requires2FA: false }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (error: any) {
          if (error.errorMessage === "SESSION_PASSWORD_NEEDED") {
            return new Response(
              JSON.stringify({ sessionString: "", requires2FA: true }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          throw error;
        }
      }

      case "checkPassword": {
        const { password, sessionId } = params;
        const sessionString = sessions.get(sessionId) || "";
        const session = new StringSession(sessionString);
        const client = new TelegramClient(session, apiId, apiHash, {
          connectionRetries: 5,
        });

        await client.connect();
        await client.signInWithPassword({ apiId, apiHash }, {
          password: async () => password,
          onError: (err: Error) => {
            throw err;
          },
        });

        const newSessionString = client.session.save() as unknown as string;
        sessions.set(sessionId, newSessionString);

        return new Response(
          JSON.stringify({ sessionString: newSessionString }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "sendMessage": {
        const { sessionString, botUsername, text } = params;
        const session = new StringSession(sessionString);
        const client = new TelegramClient(session, apiId, apiHash, {
          connectionRetries: 5,
        });

        await client.connect();

        const result = await client.invoke(
          new Api.contacts.ResolveUsername({
            username: botUsername.replace("@", ""),
          })
        );

        if (result.users.length === 0) {
          throw new Error("Bot not found");
        }

        const bot = result.users[0];
        if (!("id" in bot) || !("accessHash" in bot)) {
          throw new Error("Invalid bot user");
        }
        const botPeer = new Api.InputPeerUser({
          userId: bigInt(bot.id.toString()),
          accessHash: bigInt(bot.accessHash?.toString() || "0"),
        });

        await client.invoke(
          new Api.messages.SendMessage({
            peer: botPeer,
            message: text,
            randomId: bigInt(Math.floor(Math.random() * 1000000000)),
          })
        );

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "getMessages": {
        const { sessionString, botUsername, limit = 50 } = params;
        const session = new StringSession(sessionString);
        const client = new TelegramClient(session, apiId, apiHash, {
          connectionRetries: 5,
        });

        await client.connect();

        const result = await client.invoke(
          new Api.contacts.ResolveUsername({
            username: botUsername.replace("@", ""),
          })
        );

        if (result.users.length === 0) {
          throw new Error("Bot not found");
        }

        const bot = result.users[0];
        if (!("id" in bot) || !("accessHash" in bot)) {
          throw new Error("Invalid bot user");
        }
        const botPeer = new Api.InputPeerUser({
          userId: bigInt(bot.id.toString()),
          accessHash: bigInt(bot.accessHash?.toString() || "0"),
        });

        const history = await client.invoke(
          new Api.messages.GetHistory({
            peer: botPeer,
            limit,
          })
        );

        const messages: any[] = [];
        
        if ("messages" in history) {
          for (const msg of history.messages) {
            if ("message" in msg && msg.message) {
              messages.push({
                id: "id" in msg ? msg.id : 0,
                text: msg.message,
                sender: "out" in msg && msg.out ? "user" : "bot",
                timestamp: "date" in msg ? new Date(msg.date * 1000).toISOString() : new Date().toISOString(),
              });
            }
          }
        }

        return new Response(
          JSON.stringify({ messages: messages.reverse() }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "checkAuth": {
        const { sessionString } = params;
        const session = new StringSession(sessionString);
        const client = new TelegramClient(session, apiId, apiHash, {
          connectionRetries: 5,
        });

        await client.connect();
        const isAuthorized = await client.checkAuthorization();

        return new Response(
          JSON.stringify({ isAuthorized }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
