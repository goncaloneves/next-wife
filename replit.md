# Next Wife - Telegram Channel Feed Viewer

## Overview
Next Wife is a web application that displays posts from the @nextwife_ai Telegram channel, offering an AI companion/virtual girlfriend service. The platform aims to provide a rich, interactive user experience, similar to dating apps, to engage users with AI companions globally. The project focuses on facilitating discovery and interaction with virtual girlfriends through an intuitive interface.

## User Preferences
- Keep all 43 unused shadcn/ui components for future use
- Privacy commitment: Messages NOT logged, NOT used for AI training

## System Architecture
The application features a dual-server architecture with a Vite, React, TypeScript, shadcn/ui, and Tailwind CSS frontend, and a Node.js Express backend. The Express server handles Telegram data scraping, image proxying, and serves static frontend assets. PostgreSQL is used for persistent storage of girlfriend profiles, enabling efficient filtering and querying.

**UI/UX Decisions:**
- **Navigation:** Implements Tinder-style swipe gestures, keyboard shortcuts, side arrow buttons, and a bottom action bar.
- **Profile Display:** Uses Tinder-style overlay badges for key profile information and supports responsive layouts (horizontal carousel for mobile, grid for desktop).
- **Filter System:** Redesigned filters as horizontal scrollable chips with multi-select and an active filter count badge.
- **Theme:** Supports a dark theme.

**Technical Implementations & Feature Specifications:**
- **Real-time Feed & Filtering:** Displays Telegram channel posts with multi-selectable filters for Region, Age bracket, Occupation Category, Personality, Relationship, and Media type.
- **Dedicated Profile Pages:** Individual, shareable profile pages with full details and a "Message on Telegram" call-to-action.
- **Bot Integration:** Special `/find` URL for Telegram bot integration, opening profiles in a Tinder-style view with swipe navigation, and `/find?view=app` for embedded mini-app mode.
- **Telegram Mini App Support:** Integrates with Telegram WebApp SDK for full-screen display, disabled vertical swipes, safe area handling, and direct Telegram link opening.
- **Profile Layout:** Fixed footer with action buttons and an expandable "About Me" section.
- **Multi-Media Carousel:** Instagram-style carousel with segmented progress bars for profiles with multiple photos/videos. Supports tap navigation, auto-advance, and muted autoplay for videos. Videos are always sorted first in the array.
- **Bot Link Handling:** Special handling for `@nextwifebot` links, redirecting to the bot or opening a lightbox.
- **Robust Image Loading:** Includes a retry mechanism for image loading.
- **Content Enrichment:** Extracts personality and relationship types from Telegram post text and derives native languages using `countries-list`.
- **Feed Management:** Hides service messages, detects new posts, and provides a refresh capability.
- **Scroll Position Restoration:** Caches feed state in `sessionStorage` for accurate scroll position restoration with virtualized lists.
- **Desktop Profile Overlay:** Profiles open as full-screen overlays on desktop, preserving background feed state.
- **Virtualized Feed Grid:** Uses TanStack Virtual for performance, supporting smooth scrolling through thousands of posts with dynamic row height calculation and responsive columns.
- **Conversion Tracking:** Tracks "Meet on Telegram" clicks for analytics.
- **Swipe Visual Feedback:** Provides distinct visual feedback for left and right swipes.
- **Mini App Direct Redirect:** In Telegram Mini App, right swipe or heart tap directly redirects to Telegram without confirmation.
- **Automatic Deleted Post Detection:** Background scheduler soft-deletes removed posts with instant sync updates.
- **Occupation Categories:** Groups 283 job titles into 12 broad categories.
- **Error Handling:** API failures are handled silently.
- **Dynamic SEO:** Server generates dynamic `/sitemap.xml` and `/robots.txt` with proper indexing rules.
- **Social Media Previews:** Dynamic Open Graph and Twitter Card meta tags for rich link previews of profile pages.

**System Design Choices:**
- **PostgreSQL Database:** Stores profiles with derived fields and `click_count`.
- **Background Sync Service:** Regularly fetches, updates, and enriches data from Telegram.
- **Image Proxy:** Proxies Telegram CDN images to resolve CORS issues.
- **High-Resolution Media (Bot API):** Telegram Bot API is the primary source for new posts, providing high-res media via `file_ids`. A fallback mechanism uses telesco.pe for media URLs.
- **Persistent Bot State:** Stores `last_update_id` and `backfill_chat_id` in `bot_state` table for server restart resilience and auto-backfill.
- **Auto-Fix File ID Mismatches:** A scheduled task automatically re-fetches `file_ids` for mismatched posts.
- **High-Res URL Caching:** Server-side in-memory cache for Bot API file URLs reduces API calls.
- **Frontend Fallback:** If high-res images fail, the frontend falls back to preview URLs.
- **Unified Media Array (`mediaItems`):** Server returns a standardized `mediaItems` array with type, URL, preview URL, and quality information.
- **FilterContext Architecture:** Centralized React Context for filter state management, synchronizing with localStorage and URL parameters for persistence and shareability.
- **Homepage Header Videos:** Displays 4 dynamic looped videos from the channel, pre-processed server-side into ping-pong loops and cached.

## External Dependencies
- **Telegram API:** For scraping channel posts and media, and for high-resolution media via the Bot API.
- **PostgreSQL Database:** Primary data store.
- **`countries-list` (npm package):** Used for nationality-to-language mapping.
- **i18next + react-i18next:** For internationalization.