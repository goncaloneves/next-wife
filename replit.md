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
- Tinder-style profile badges on images (Name, Age, Nationality, Hometown, Work)
- **Feed filtering by Region, Age bracket, Occupation Category, Personality, and Relationship**
- PostgreSQL database for persistent storage and fast filtered queries
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

## Recent Changes (January 9, 2026)
19. **Personality and Relationship filters** - Added new filter categories with emoji labels:
    - Personality types: 🙈 Shy, 🤭 Playful, 💕 Caring, 🔥 Passionate, 🌸 Submissive, 😈 Dominant
    - Relationship types: ❓ Stranger, 📚 Classmate, 💼 Coworker, 🤝 Best Friend, 💕 Girlfriend, 💍 Wife
    - Parser extracts "Personality:" and "Relationship:" fields from Telegram posts
    - Default: relationship="girlfriend" when not specified, personality=null
    - Values stored lowercase in DB, mapped to emoji labels via `src/lib/girlfriends/profile-formatter.ts`
    - URL parameters: `?personality=` and `?relationship=` for deep linking

## Changes (December 22, 2025)
18. **Hot sorting by popularity** - Added "Hot" button with 🔥 emoji to sort girlfriends by popularity:
    - Click tracking: Each profile click increments `click_count` in database
    - POST `/api/tg-post-click?id=<postId>` endpoint for async click tracking
    - GET `/api/tg-channel-feed?sort=hot` returns profiles sorted by clicks first, then zero-click by newest
    - SQL ORDER BY: `CASE WHEN click_count > 0 THEN 0 ELSE 1 END, click_count DESC, date DESC`
    - `isHot` flag marks posts with clicks as hot; fallback marks first 8 newest if no clicks exist
    - 🔥 Hot badge overlay in top-right corner of hot girlfriend images (gradient orange-rose pill)
    - Hot badge shows by default in both Recent and Hot sorting modes
    - Sort toggle with "✨ Recent" and "🔥 Hot" buttons (Recent is default selected)
    - Segmented control style with subtle background, Hot gets gradient when active
    - Auto-refresh disabled in Hot mode (popularity sorting doesn't benefit from new post detection)
    - Click tracking fires asynchronously without blocking user interaction

## Changes (December 21, 2025)
17. **Fixed nationality mappings** - Added missing nationalities to region and language mappings:
    - Cape Verdean: now mapped to African region and Portuguese language
    - Balinese: now mapped to Asian region and Indonesian language
    - Updated 128 posts in database with corrected values

16. **Multi-select filters** - Filters now support selecting multiple values per category:
    - Select multiple regions (e.g., Asian AND European)
    - Select multiple age brackets (e.g., 21-25 AND 26-30)
    - Select multiple languages, occupations, or cities simultaneously
    - Chips toggle on/off instead of single-select
    - "All" chip clears selections for that category
    - "Clear all" button in footer resets all filters
    - Backend uses PostgreSQL `ANY()` operator for array filtering
    - Filter count badge shows total number of selected values

15. **Tinder-style filter button placement** - Moved Filters button next to "Pick your Girlfriend" title:
    - Filter button now appears on the right side of the title row (Tinder/Bumble pattern)
    - Uses controlled state passed from Index.tsx to FeedFilters component
    - Active filter count displayed as gradient badge on the button
    - Filter panel overlays content as a modal with backdrop (no layout shift)
    - Reduces vertical space between title and feed images

14. **Instagram-style chip filters** - Redesigned filter UI from dropdowns to horizontal scrollable chips:
    - Chip components with gradient styling for selected state (orange-to-rose)
    - Expandable filter sections with "Show more/less" for categories with many options
    - Active filter tags displayed as dismissible chips with "Clear all" button
    - Horizontal scroll with hidden scrollbar for mobile-friendly UX
    - Proper data-testid normalization for stable test selectors

13. **Automatic deleted post detection** - Background scheduler detects and soft-deletes posts removed from Telegram:
    - Added `deleted_at` column to database for soft-delete functionality
    - All queries filter out deleted posts with `deleted_at IS NULL`
    - **Background scheduler runs every 10 minutes** for delete detection (independent of page visits)
    - **Quick sync on every page load**: Fetches only NEW posts from Telegram until it finds one already in DB (instant updates)
    - Compares recent 200 posts in DB against live Telegram data
    - Posts that reappear are automatically "resurrected" (deleted_at cleared)
    - Normalized channel names (no @, no underscores) for consistent queries
    - Note: The 200 post limit covers typical deletion patterns; older deleted posts will persist but are rare edge cases

12. **Occupation categories** - Grouped 283 individual job titles into 12 categories for cleaner filtering:
    - Arts & Gallery (726), Design & Creative (541), Food & Hospitality (345)
    - Business & Marketing (205), Photography & Film (102), Other (91)
    - Education & Academia (84), Architecture (51), Healthcare & Wellness (34)
    - Fashion & Beauty (10), Tech & Engineering (8), Travel & Tourism (3)
    - Categories derived from keyword matching in job descriptions

11. **Feed filtering system** - Added dropdown filters for Region, Age bracket, and Occupation above the feed
    - PostgreSQL database for persistent storage of girlfriend profiles
    - Background sync service fetches posts from Telegram and stores with derived fields
    - Nationality-to-region mapping (Asian, European, Latin American, North American, African, Middle Eastern, Oceanian)
    - Age brackets: 21-25, 26-30, 30+
    - Occupation categories replace individual work options for cleaner UX
    - Filters apply to both mobile carousel and desktop grid views

## Changes (November 6, 2025)
10. **Tinder-style profile badges and mobile carousel** - Added overlay badges on images showing Name, Age, Nationality, Hometown, and Work (parsed from post text)
    - **Mobile/Tablet**: Horizontal scroll carousel showing one large card at a time (90vw width, snap-scroll like Tinder)
      - Horizontal infinite scroll - loads more posts when swiping near the end
      - All details always visible (Nationality, Hometown, Work - 2 lines max)
    - **Desktop**: Grid view with 4 columns and hover interactions
      - Vertical infinite scroll - loads more when scrolling down
      - Only Name + Age visible by default, details slide in on hover (Work - 3 lines max)
    - Fluid height - badges adapt to content (no fixed min-height)
    - Only displays when all profile fields are present

## Previous Changes (November 1, 2025)
1. **Migrated from Supabase to Express backend** - Replaced Supabase Edge Functions with standalone Express server
2. **Implemented bot link extraction** - Backend now extracts parameterized bot URLs from post HTML
3. **Image click behavior** - Posts with botLink redirect to bot URL, others open lightbox
4. **Fixed production deployment** - Express server now serves built static files in production
5. Changed feed section heading from "Live from Next Wife 🌻" to "Pick your Girlfriend 🌻"
6. Removed all Bali-specific references
7. Fixed image loading during scroll with improved skeleton loader visibility
8. **Silent error handling** - Removed red error block, API failures now fail silently
9. **Fixed deployment compatibility** - Replaced wildcard route with regex pattern `/^\/(?!api).*/` for universal Express compatibility

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
Express server (`server.js`) provides the following endpoints:

### GET /api/tg-channel-feed
- Queries PostgreSQL database when filters are applied, falls back to live Telegram scraping
- Supports filtering via `?region=`, `?ageBracket=`, `?work=` parameters
- Supports pagination via `?before=` and `?limit=` parameters
- Returns JSON with channel info and posts array

### GET /api/tg-channel-filters
- Returns available filter options from the database
- Response: `{ regions: [...], ageBrackets: [...], workOptions: [...] }`

### POST /api/tg-sync
- Triggers manual background sync of Telegram posts to database
- Parameters: `?channel=`, `?pages=` (number of pages to sync)

### GET /api/tg-image-proxy
- Proxies Telegram CDN images to avoid CORS issues
- Validates allowed hosts (telesco.pe, telegram-cdn.org)
- Returns image with proper caching headers
- Parameter: `?u=<encoded_image_url>`

## Database Schema
PostgreSQL table `telegram_posts` stores girlfriend profiles:
- `id`: Telegram post ID (primary key)
- `channel`: Channel name
- `text`, `date`, `link`, `media`, `avatar`, `bot_link`: Post content
- `name`, `age`, `nationality`, `hometown`, `work`: Profile fields
- `region`: Derived from nationality (Asian, European, Latin American, etc.)
- `age_bracket`: Derived from age (21-25, 26-30, 30+)
- Indexes on channel+date, region, age_bracket, work for fast filtering

## User Preferences
- Keep all 43 unused shadcn/ui components for future use
- Privacy commitment: Messages NOT logged, NOT used for AI training
