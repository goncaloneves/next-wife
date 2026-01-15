# Next Wife - Telegram Channel Feed Viewer

## Overview
Next Wife is a web application designed to display posts from the @nextwife_ai Telegram channel, which provides an AI companion/virtual girlfriend service. The platform allows users to discover virtual girlfriends from various global locations. The project aims to provide a rich, interactive user experience similar to dating apps, facilitating user engagement with the AI companions.

## User Preferences
- Keep all 43 unused shadcn/ui components for future use
- Privacy commitment: Messages NOT logged, NOT used for AI training

## System Architecture
The application uses a dual-server architecture: a frontend built with Vite, React, TypeScript, shadcn/ui, and Tailwind CSS, and a Node.js Express backend. The Express server is responsible for Telegram data scraping, image proxying, and serving the static frontend assets in production. PostgreSQL is used for persistent storage of girlfriend profiles, enabling efficient filtering and querying.

**UI/UX Decisions:**
- **Tinder-style Navigation:** Implemented swipe gestures, keyboard shortcuts, side arrow buttons, and a bottom action bar for navigating between profiles.
- **Profile Badges:** Tinder-style overlay badges on images display Name, Age, Nationality, Hometown, and Work.
- **Responsive Design:** Features a horizontal scroll carousel for mobile/tablet (90vw width, snap-scroll) and a grid view for desktop (4 columns with hover interactions).
- **Filter UI:** Redesigned filters from dropdowns to horizontal scrollable chips with gradient styling and multi-select capabilities. An active filter count badge is displayed.
- **Dark Theme:** Supports a dark theme for consistent user experience.

**Technical Implementations & Feature Specifications:**
- **Real-time Feed & Filtering:** Displays Telegram channel posts with filtering capabilities by Region, Age bracket, Occupation Category, Personality, Relationship, and Media type (Has Video, Multiple Photos). Filters are multi-selectable.
- **Dedicated Profile Pages:** Individual profile pages (`/profile/:id`) with shareable URLs, displaying full details and a "Message on Telegram" CTA.
- **Bot Entry Point:** Special `/find` URL for Telegram bot integration that opens the latest profile in full Tinder-style profile view with swipe navigation. Use `/find?view=app` to disable all exit navigation for embedded mini app mode.
- **Telegram Mini App Support:** Integrated with Telegram WebApp SDK (only when `view=app`):
  - Auto-expands to full screen on load via `expand()` + retry logic
  - Disables vertical swipes to prevent accidental closure via `disableVerticalSwipes()`
  - Safe area handling for device notches/home indicators
  - "Meet on Telegram" opens link and closes mini app via `openTelegramLink()` + `close()`
- **Profile Layout:** Fixed footer with action buttons (skip/heart/undo) that stays in place when About Me expands. About Me section can expand to full image height without scroll.
- **Multi-Media Carousel:** Profiles with multiple photos/videos display an Instagram-style carousel with segmented progress bars at the top. Users can tap left/right sides of the image to navigate between media. Media stored as JSONB array [{type: 'photo'|'video', url: string}] in `media_urls` column.
- **Instagram-style Auto-Advance:** Media carousel auto-advances like Instagram Stories - each photo/video shows for 5 seconds with an animated progress bar, then advances to the next. After the last media item, it loops back to the first. Progress bars show: filled (past), animating (current), dimmed (upcoming).
- **Video Playback:** Videos play with muted autoplay, no looping - they advance to next media when finished. Progress bar syncs with video playback duration.
- **Bot Link Handling:** Special handling for `@nextwifebot` links; clicking an image with a bot link redirects to the bot, otherwise opens a lightbox. The backend extracts these links.
- **Image Loading:** Includes a retry mechanism (3 attempts with progressive timing) for robust image loading.
- **Post Filtering:** Hides service messages from the feed.
- **Automatic New Post Detection:** Detects new posts and provides a refresh capability.
- **Content Parsing:** Extracts personality and relationship types from Telegram post text.
- **Language Display:** Uses `countries-list` to derive and display native languages alongside English.
- **Scroll Position Restoration:** Caches feed state in `sessionStorage` to restore scroll position upon returning from profile pages. Uses anchor post ID with virtualizer.scrollToIndex for accurate restoration with virtualized lists.
- **Desktop Profile Overlay:** On desktop, clicking a profile opens it as a full-screen overlay instead of navigating away. The feed stays mounted in the background, preserving video playback and scroll position. Uses React Router's background location pattern: URL changes to `/profile/:id`, back button closes overlay, skip/undo use replace navigation. Mobile continues to use full page navigation.
- **Virtualized Feed Grid:** Uses TanStack Virtual (@tanstack/react-virtual) with window-based virtualization for performance. Only renders ~20-40 visible rows at once, enabling smooth scrolling through 4000+ posts. Uses padding-based approach (paddingTop/paddingBottom) instead of absolute positioning for reliable scroll behavior. Responsive columns: 2 (768-1024px), 3 (1024-1280px), 4 (1280px+). Dynamic row height calculation via ResizeObserver maintains 3:4 aspect ratio.
- **Conversion Tracking:** Tracks when users click "Meet on Telegram" (the final conversion point) rather than feed clicks. The `click_count` field stores these conversions for future analytics.
- **Swipe Visual Feedback:** Left swipe darkens the card, right swipe shows a warm sunset gradient overlay covering the entire card (image, titles, buttons).
- **Mini App Direct Redirect:** In Telegram Mini App (detected via SDK `window.Telegram.WebApp`), swiping right or tapping heart skips the confirmation popup and goes directly to Telegram. The `?view=app` URL parameter separately controls UI (hides back button, disables Escape key exit).
- **Automatic Deleted Post Detection:** A background scheduler soft-deletes posts removed from Telegram, and a quick sync mechanism handles instant updates on page load.
- **Occupation Categories:** Groups 283 job titles into 12 broad categories for simplified filtering.
- **Silent Error Handling:** API failures are handled silently without displaying error blocks to the user.
- **Dynamic SEO Files:** Server generates `/sitemap.xml` and `/robots.txt` dynamically. Sitemap includes all active profile URLs with proper lastmod dates for search engine indexing. Cached for 1 hour.
- **Social Media Previews:** Dynamic Open Graph and Twitter Card meta tags for profile pages. When social crawlers (Facebook, Twitter, LinkedIn, WhatsApp, Discord, etc.) access a profile URL, they receive custom HTML with the woman's photo, name, age, and description for rich link previews.

**System Design Choices:**
- **PostgreSQL Database:** Stores girlfriend profiles with derived fields (region, age_bracket, occupation category, personality, relationship, language, has_video, has_multiple_media), `click_count` for conversion tracking, and `photo_file_ids` for high-resolution media access.
- **Background Sync Service:** Regularly fetches posts from Telegram and updates the database, enriching data with derived fields.
- **Image Proxy:** Proxies Telegram CDN images to prevent CORS issues.
- **High-Resolution Media (Bot API):** Telegram Bot API is the PRIMARY source for new posts. The `pollBotUpdates()` function runs FIRST during sync, creating posts directly with file IDs from the start. It parses caption text to extract profile data (name, age, nationality, etc.), extracts bot links from entities, and groups updates by `media_group_id` for multi-photo albums. The scraper (telesco.pe) runs AFTER and enriches posts with media_urls for fallback. The `/api/tg-highres-image?file_id=XXX` endpoint streams high-res images from Bot API.
- **Persistent Bot State:** The `bot_state` table stores `last_update_id` to survive server restarts, preventing lost Bot API updates. Also stores `backfill_chat_id` for auto-backfill destination.
- **Auto-Fix File ID Mismatches:** Every 10 minutes, the scheduler automatically re-fetches file_ids using `forwardMessage` for posts where count doesn't match `media_urls` count. Prioritizes fixing mismatches first, then backfills missing file_ids. Processes 30 posts per sync cycle. Requires `backfill_chat_id` to be configured.
- **Manual Backfill API:** POST `/api/tg-set-backfill-chat` with `{"chat_id": YOUR_ID}` to configure destination. POST `/api/tg-backfill-file-ids?limit=50` to trigger batch backfill.
- **High-Res URL Caching:** Server caches Bot API file URLs for 45 minutes in-memory (Map with TTL) to reduce API calls by ~95%. Automatic cleanup when cache exceeds 5000 entries. Use `?refresh=true` query param to force cache invalidation. Browser also caches for 45 minutes via Cache-Control header.
- **Frontend Fallback:** If high-res image fails to load, frontend automatically falls back to preview/proxy URL (public channel images). The ImageCard component tracks error counts per image and switches to `previewUrl` from `mediaItems` on failure.
- **Unified Media Array (mediaItems):** Server returns a `mediaItems` array with ready-to-use URLs. Each item has `{type, url, previewUrl, quality}`. Quality values: `high` (Bot API high-res), `preview` (proxy), `direct` (CDN for videos). Videos are NOT proxied - served directly from Telegram CDN. Frontend uses mediaItems as the canonical source; legacy `media`/`mediaUrls` preserved for backward compatibility.
- **FilterContext Architecture:** Centralized filter state management using React Context (`FilterContext`). Single source of truth for filter state shared between homepage and profile pages. Filter changes sync to localStorage for persistence across page refreshes. Both pages use `DiscoverFilterModal` for consistent filter UI.

## External Dependencies
- **Telegram API:** For scraping channel posts and media.
- **PostgreSQL Database:** Primary data store for girlfriend profiles and associated metadata.
- **`countries-list` (npm package):** Used for accurate nationality-to-language mapping.