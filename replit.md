# Next Wife - Telegram Channel Feed Viewer

## Overview
A Vite + React + TypeScript web application that displays posts from the @nextwife_ai Telegram channel. The service is an AI companion/virtual girlfriend platform where users meet girlfriends from their native locations around the world through Telegram.

## Architecture
- **Frontend**: React + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Backend**: Supabase Edge Functions for web scraping and image proxying
- **Deployment**: Replit with custom domain support

## Key Features
- Real-time Telegram channel feed display
- Image loading with retry mechanism (3 attempts with progressive timing)
- Post filtering (hides service messages)
- Automatic new post detection with refresh capability
- Special link handling for bot mentions
- Responsive design with dark theme

## Special Link Handling
Posts containing "Meet me @nextwifebot 💖" automatically link to the bot instead of the post:
- Detection: Frontend checks if post text contains "meet me @nextwifebot" (case-insensitive)
- Link override: Uses `https://t.me/nextwifebot` instead of the standard post link
- Location: `src/components/TelegramChannelFeed.tsx` lines 428-430

## Content Guidelines
- Girlfriends are from their native locations globally (not specifically Bali)
- Users "meet" their girlfriend (long-distance relationship concept)
- No Bali references in hero section or features
- Privacy-focused: Messages NOT logged, NOT used for AI training

## Recent Changes (November 1, 2025)
1. Removed all Bali-specific references
2. Updated hero subtitle to "Meet the girlfriend you create and embark on a romantic journey, sharing unique stories from around the globe"
3. Fixed image loading during scroll with improved skeleton loader visibility
4. Updated feature descriptions to avoid repetitive phrasing
5. Added special link handling for bot mentions in posts

## Data Model
Posts from Telegram channel include:
- `id`: Post number
- `text`: Post content (HTML stripped)
- `date`: ISO 8601 timestamp
- `link`: Telegram post URL
- `media`: Image URL (if present)
- `avatar`: Channel avatar URL

## Edge Function
Located at `supabase/functions/tg-channel-feed/index.ts`
- Scrapes Telegram public channel page (https://t.me/s/nextwife_ai)
- Filters out service messages (joins, leaves, etc.)
- Proxies images through Supabase to avoid CORS issues
- Returns JSON with channel info and posts array

## User Preferences
- Keep all 43 unused shadcn/ui components for future use
- Privacy commitment: Messages NOT logged, NOT used for AI training
