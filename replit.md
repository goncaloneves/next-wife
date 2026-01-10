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
- **Bot Entry Point:** Special `/discover` URL for Telegram bot integration that opens the latest profile in full Tinder-style profile view with swipe navigation. Use `/discover?view=app` to disable all exit navigation for embedded mini app mode.
- **Telegram Mini App Support:** Integrated with Telegram WebApp SDK (only when `view=app`):
  - Auto-expands to full screen on load via `expand()` + retry logic
  - Disables vertical swipes to prevent accidental closure via `disableVerticalSwipes()`
  - Safe area handling for device notches/home indicators
  - "Meet on Telegram" opens link and closes mini app via `openTelegramLink()` + `close()`
- **Profile Layout:** Fixed footer with action buttons (skip/heart/undo) that stays in place when About Me expands. About Me section can expand to full image height without scroll.
- **Multi-Media Carousel:** Profiles with multiple photos/videos display a Tinder-style carousel with dot indicators at the top. Users can tap left/right sides of the image to navigate between media. Media stored as JSONB array [{type: 'photo'|'video', url: string}] in `media_urls` column.
- **Boomerang Video Effect:** Videos on hover/focus play with a boomerang effect (forward then backward loop). Uses ImageBitmap frame buffer approach - captures frames at 15fps during forward playback, then loops through buffer forward/backward on a canvas overlay. Falls back to normal looped video if frame capture fails (CORS issues, etc). Implemented in `src/hooks/useBoomerangVideo.ts`.
- **Bot Link Handling:** Special handling for `@nextwifebot` links; clicking an image with a bot link redirects to the bot, otherwise opens a lightbox. The backend extracts these links.
- **Image Loading:** Includes a retry mechanism (3 attempts with progressive timing) for robust image loading.
- **Post Filtering:** Hides service messages from the feed.
- **Automatic New Post Detection:** Detects new posts and provides a refresh capability.
- **Content Parsing:** Extracts personality and relationship types from Telegram post text.
- **Language Display:** Uses `countries-list` to derive and display native languages alongside English.
- **Scroll Position Restoration:** Caches feed state in `sessionStorage` to restore scroll position upon returning from profile pages.
- **"Hot" Sorting:** Allows sorting profiles by popularity (`click_count`) with a "Hot" badge overlay. Click tracking is asynchronous.
- **Automatic Deleted Post Detection:** A background scheduler soft-deletes posts removed from Telegram, and a quick sync mechanism handles instant updates on page load.
- **Occupation Categories:** Groups 283 job titles into 12 broad categories for simplified filtering.
- **Silent Error Handling:** API failures are handled silently without displaying error blocks to the user.

**System Design Choices:**
- **PostgreSQL Database:** Stores girlfriend profiles with derived fields (region, age_bracket, occupation category, personality, relationship, language, has_video, has_multiple_media) and `click_count` for sorting.
- **Background Sync Service:** Regularly fetches posts from Telegram and updates the database, enriching data with derived fields.
- **Image Proxy:** Proxies Telegram CDN images to prevent CORS issues.

## External Dependencies
- **Telegram API:** For scraping channel posts and media.
- **PostgreSQL Database:** Primary data store for girlfriend profiles and associated metadata.
- **`countries-list` (npm package):** Used for accurate nationality-to-language mapping.