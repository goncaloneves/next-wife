import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
  };
  chat: {
    id: number;
  };
  text: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, chatId } = await req.json();
    
    if (!message) {
      console.error('No message provided');
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN is not configured');
      return new Response(
        JSON.stringify({ error: 'Bot token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const telegramApiBase = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
    
    // Use a consistent chat ID for the web interface
    // In a production app, you might want to use user sessions or IDs
    const webChatId = chatId || 'web_user_' + Date.now();
    
    console.log(`Sending message to Telegram bot - Chat ID: ${webChatId}`);
    console.log(`Message: ${message}`);

    // Send message to the bot
    // Note: This will only work if your bot is configured to receive and respond to messages
    // The bot needs to be set up to handle incoming messages from this chat ID
    const sendResponse = await fetch(`${telegramApiBase}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: webChatId,
        text: message,
      }),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error('Error sending message to Telegram:', errorText);
      
      // If the error is about chat not found, provide helpful message
      if (errorText.includes('chat not found')) {
        return new Response(
          JSON.stringify({ 
            error: 'Chat not found. Please start a conversation with your bot on Telegram first.',
            details: 'Visit https://t.me/nextwifebot to start chatting with the bot.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to send message to Telegram bot', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sendData = await sendResponse.json();
    console.log('Message sent successfully:', sendData);

    // For a simple demo, we'll return a mock response
    // In a real implementation, you would need to:
    // 1. Set up a webhook to receive bot responses, OR
    // 2. Poll getUpdates endpoint, OR
    // 3. Use a database to queue responses
    
    // Mock response for demonstration
    const botResponse = {
      text: "I received your message! This is a demo response. To get real responses, your bot needs to be configured with proper message handling logic.",
      chatId: webChatId,
      timestamp: new Date().toISOString()
    };

    console.log('Returning response:', botResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: botResponse,
        note: "This is a demo response. Configure your bot's message handler for real responses."
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in telegram-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
