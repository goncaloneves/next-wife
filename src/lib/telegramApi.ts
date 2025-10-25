const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-client`;

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

let currentSessionId = generateSessionId();

export const sendCode = async (phoneNumber: string) => {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "sendCode", phoneNumber }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send code");
  }

  return await response.json();
};

export const signIn = async (
  phoneNumber: string,
  code: string,
  phoneCodeHash: string
) => {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "signIn",
      phoneNumber,
      code,
      phoneCodeHash,
      sessionId: currentSessionId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to sign in");
  }

  return await response.json();
};

export const checkPassword = async (password: string) => {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "checkPassword",
      password,
      sessionId: currentSessionId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to verify password");
  }

  const data = await response.json();
  return data.sessionString;
};

export const sendMessage = async (
  sessionString: string,
  botUsername: string,
  text: string
) => {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "sendMessage",
      sessionString,
      botUsername,
      text,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send message");
  }

  return await response.json();
};

export const getMessages = async (
  sessionString: string,
  botUsername: string,
  limit = 50
) => {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "getMessages",
      sessionString,
      botUsername,
      limit,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get messages");
  }

  const data = await response.json();
  // Convert ISO string timestamps back to Date objects
  return data.messages.map((msg: any) => ({
    ...msg,
    timestamp: new Date(msg.timestamp),
  }));
};

export const restoreSession = async (sessionString: string) => {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "checkAuth",
      sessionString,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to restore session");
  }

  const data = await response.json();
  if (!data.isAuthorized) {
    throw new Error("Session expired");
  }

  return true;
};
