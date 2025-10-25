import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import bigInt from "big-integer";

const apiId = parseInt(import.meta.env.VITE_TELEGRAM_API_ID || "0");
const apiHash = import.meta.env.VITE_TELEGRAM_API_HASH || "";

let client: TelegramClient | null = null;
let botPeer: Api.InputPeerUser | null = null;

export const initializeClient = async (sessionString = "") => {
  const session = new StringSession(sessionString);
  client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });
  
  await client.connect();
  return client;
};

export const sendCode = async (phoneNumber: string) => {
  if (!client) {
    await initializeClient();
  }
  
  const result = await client!.sendCode(
    {
      apiId,
      apiHash,
    },
    phoneNumber
  );
  
  return {
    phoneCodeHash: result.phoneCodeHash,
  };
};

export const signIn = async (
  phoneNumber: string,
  code: string,
  phoneCodeHash: string
) => {
  if (!client) {
    throw new Error("Client not initialized");
  }

  try {
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber,
        phoneCodeHash,
        phoneCode: code,
      })
    );

    const sessionString = client.session.save() as unknown as string;
    return { sessionString, requires2FA: false };
  } catch (error: any) {
    if (error.errorMessage === "SESSION_PASSWORD_NEEDED") {
      return { sessionString: "", requires2FA: true };
    }
    throw error;
  }
};

export const checkPassword = async (password: string) => {
  if (!client) {
    throw new Error("Client not initialized");
  }

  await client.signInWithPassword(
    {
      apiId,
      apiHash,
    },
    {
      password: async () => password,
      onError: (err: Error) => {
        throw err;
      },
    }
  );

  const sessionString = client.session.save() as unknown as string;
  return sessionString;
};

export const resolveBotPeer = async (botUsername: string) => {
  if (!client) {
    throw new Error("Client not initialized");
  }

  const result = await client.invoke(
    new Api.contacts.ResolveUsername({
      username: botUsername.replace("@", ""),
    })
  );

  if (result.users.length === 0) {
    throw new Error("Bot not found");
  }

  const bot = result.users[0];
  if ("id" in bot && "accessHash" in bot) {
    botPeer = new Api.InputPeerUser({
      userId: bigInt(bot.id.toString()),
      accessHash: bigInt(bot.accessHash?.toString() || "0"),
    });
  }

  return botPeer;
};

export const sendMessage = async (botUsername: string, text: string) => {
  if (!client) {
    throw new Error("Client not initialized");
  }

  if (!botPeer) {
    await resolveBotPeer(botUsername);
  }

  const result = await client.invoke(
    new Api.messages.SendMessage({
      peer: botPeer!,
      message: text,
      randomId: bigInt(Math.floor(Math.random() * 1000000000)),
    })
  );

  return result;
};

export const getMessages = async (botUsername: string, limit = 50) => {
  if (!client) {
    throw new Error("Client not initialized");
  }

  if (!botPeer) {
    await resolveBotPeer(botUsername);
  }

  const result = await client.invoke(
    new Api.messages.GetHistory({
      peer: botPeer!,
      limit,
    })
  );

  const messages: any[] = [];
  
  if ("messages" in result) {
    for (const msg of result.messages) {
      if ("message" in msg && msg.message) {
        messages.push({
          id: "id" in msg ? msg.id : 0,
          text: msg.message,
          sender: "out" in msg && msg.out ? "user" : "bot",
          timestamp: "date" in msg ? new Date(msg.date * 1000) : new Date(),
        });
      }
    }
  }

  return messages.reverse();
};

export const addMessageListener = (
  botUsername: string,
  callback: (message: any) => void
) => {
  if (!client) {
    throw new Error("Client not initialized");
  }

  client.addEventHandler(async (update: any) => {
    if (update.className === "UpdateNewMessage") {
      const message = update.message;
      if ("message" in message && message.message) {
        // Check if message is from the bot (incoming)
        if (!("out" in message && message.out)) {
          callback({
            id: message.id,
            text: message.message,
            sender: "bot",
            timestamp: new Date(message.date * 1000),
          });
        }
      }
    }
  });
};

export const restoreSession = async (sessionString: string) => {
  await initializeClient(sessionString);
  
  if (!client) {
    throw new Error("Failed to initialize client");
  }

  const isAuthorized = await client.checkAuthorization();
  if (!isAuthorized) {
    throw new Error("Session expired");
  }

  return client;
};

export const disconnect = async () => {
  if (client) {
    await client.disconnect();
    client = null;
    botPeer = null;
  }
};

export const isAuthenticated = async () => {
  if (!client) {
    return false;
  }

  try {
    return await client.checkAuthorization();
  } catch {
    return false;
  }
};
