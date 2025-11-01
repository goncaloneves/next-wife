# Next Wife - Telegram Channel Feed Viewer

## Overview
A Vite + React + TypeScript web application that displays posts from the @nextwife_ai Telegram channel. The service is an AI companion/virtual girlfriend platform where users meet girlfriends from their native locations around the world through Telegram.

## Architecture
- **Frontend**: React + TypeScript + Vite + shadcn/ui + Tailwind CSS (port 5000)
- **Backend**: Express.js server for Telegram scraping and image proxying (port 3001)
- **Deployment**: Replit with custom domain support
  - Development: Both servers run concurrently via `npm run dev`
  - Production: Express server serves built static files from `dist/` and handles API routes

## Key Features
- Real-time Telegram channel feed display
- Image loading with retry mechanism (3 attempts with progressive timing)
- Post filtering (hides service messages)
- Automatic new post detection with refresh capability
- Special link handling for bot mentions
- Responsive design with dark theme

## Bot Link Handling
Posts containing @nextwifebot links with parameterized URLs (e.g., `?start=gf_UKXHNCwZF7Rb`) have special behavior:
- **Backend extraction**: Server.js extracts botLink from `<a>` tags before HTML is stripped (lines 85-109)
  - Uses regex `/<a\s+([^>]*?)href="([^"]*?)"([^>]*?)>([\s\S]*?)<\/a>/gi` to match links with nested HTML
  - Handles HTML entity decoding to preserve query parameters (`&amp;` → `&`)
  - Searches for "nextwifebot" in href or link text
- **Frontend behavior**: When post has botLink, clicking the image opens that URL instead of lightbox
  - Detection: `TelegramPostCard.tsx` checks if `post.botLink` exists
  - Action: Opens bot URL in new tab (e.g., `https://t.me/nextwifebot?start=gf_UKXHNCwZF7Rb`)
  - Fallback: If no botLink, opens image in lightbox as normal

## Content Guidelines
- Girlfriends are from their native locations globally (not specifically Bali)
- Users "meet" their girlfriend (long-distance relationship concept)
- No Bali references in hero section or features
- Privacy-focused: Messages NOT logged, NOT used for AI training

## Recent Changes (November 1, 2025)
1. **Migrated from Supabase to Express backend** - Replaced Supabase Edge Functions with standalone Express server
2. **Implemented bot link extraction** - Backend now extracts parameterized bot URLs from post HTML
3. **Image click behavior** - Posts with botLink redirect to bot URL, others open lightbox
4. **Fixed production deployment** - Express server now serves built static files in production
5. Changed feed section heading from "Live from Next Wife 🌻" to "Pick your Girlfriend 🌻"
6. Removed all Bali-specific references
7. Fixed image loading during scroll with improved skeleton loader visibility
8. **Silent error handling** - Removed red error block, API failures now fail silently
9. **Fixed deployment compatibility** - Updated wildcard route from `'*'` to `'/*'` for Express 4.x/path-to-regexp compatibility

## Data Model
Posts from Telegram channel include:
- `id`: Post number
- `text`: Post content (HTML stripped)
- `date`: ISO 8601 timestamp
- `link`: Telegram post URL
- `media`: Image URL (if present)
- `avatar`: Channel avatar URL
- `botLink`: Extracted URL from posts containing @nextwifebot mentions

## Backend API
Express server (`server.js`) provides two endpoints:

### GET /api/tg-channel-feed
- Scrapes Telegram public channel page (https://t.me/s/nextwife_ai)
- Filters out service messages (joins, leaves, etc.)
- Extracts bot links from HTML before stripping tags
- Returns JSON with channel info and posts array
- Supports pagination via `?before=` and `?limit=` parameters

### GET /api/tg-image-proxy
- Proxies Telegram CDN images to avoid CORS issues
- Validates allowed hosts (telesco.pe, telegram-cdn.org)
- Returns image with proper caching headers
- Parameter: `?u=<encoded_image_url>`

## User Preferences
- Keep all 43 unused shadcn/ui components for future use
- Privacy commitment: Messages NOT logged, NOT used for AI training
