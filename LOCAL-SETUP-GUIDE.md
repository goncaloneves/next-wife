# Local Development Setup Guide - Next Wife Telegram Channel Feed

This comprehensive guide will walk you through setting up and running the Next Wife website locally with the exact same result as the production version.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Overview](#project-overview)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Architecture Deep Dive](#architecture-deep-dive)
7. [Telegram Feed System](#telegram-feed-system)
8. [Image Loading & Retry Mechanism](#image-loading--retry-mechanism)
9. [Development Workflow](#development-workflow)
10. [Troubleshooting](#troubleshooting)
11. [Advanced Topics](#advanced-topics)

---

## Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`
   - Should output: `v18.x.x` or higher

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`
   - Should output: `9.x.x` or higher

3. **Git** (for cloning the repository)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

### Recommended Tools
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

---

## Project Overview

### Technology Stack
- **Frontend Framework**: React 18.3.1
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives + shadcn/ui
- **Backend**: Supabase Edge Functions (Deno runtime)
- **State Management**: React hooks + TanStack Query
- **Routing**: React Router DOM v6

### Key Features
1. **Hero Section**: Video backgrounds with responsive design
2. **Telegram Channel Feed**: Live scraping and display of Telegram posts
3. **Image Retry Logic**: 3-tier fallback system for failed image loads
4. **Layout Switching**: Grid/List view toggle
5. **Infinite Scroll**: Automatic pagination
6. **Lightbox**: Full-screen image viewing
7. **Real-time Updates**: Polling for new posts with "new posts" notification

---

## Installation

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd <project-directory>
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all dependencies listed in `package.json`, including:
- React ecosystem packages
- Radix UI components
- Supabase client
- TanStack Query
- Tailwind CSS
- And many more...

**Expected output**: 
```
added 423 packages, and audited 424 packages in 45s
```

---

## Configuration

### Step 3: Environment Variables

Create or verify the `.env` file in the project root with these exact values:

```env
VITE_SUPABASE_URL=https://ecixveojhujzzawhxmrf.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjaXh2ZW9qaHVqenphd2h4bXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNDEzMzEsImV4cCI6MjA3NjkxNzMzMX0.jMGW_Q2Lxd7cAbegPOtLWT9wPejbW2OJHFfk8WLNK58
VITE_SUPABASE_PROJECT_ID=ecixveojhujzzawhxmrf
```

**Important Notes**:
- These are the production Supabase credentials
- The `.env` file should already exist with these values
- Do NOT commit `.env` to version control (it's in `.gitignore`)

---

## Running the Application

### Step 4: Start Development Server

```bash
npm run dev
```

**Expected output**:
```
VITE v5.x.x  ready in 432 ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Step 5: Access the Application

Open your browser and navigate to: **http://localhost:8080/**

### Step 6: Verify Functionality

You should see:
1. ✅ **Hero section** with video background
2. ✅ **Telegram channel feed** loading posts from `@nextwife_ai`
3. ✅ **Grid/List view toggle** working
4. ✅ **Images loading** with retry logic
5. ✅ **Infinite scroll** loading more posts
6. ✅ **Lightbox** opening on image click

---

## Architecture Deep Dive

### Frontend Architecture

#### Component Hierarchy
```
App.tsx
└── Index.tsx (Main landing page)
    ├── Hero Section (Videos + CTA)
    ├── Features Section
    └── TelegramChannelFeed
        ├── Grid Layout
        │   └── <img> elements with retry logic
        └── List Layout
            └── TelegramPostCard[]
                └── Individual post cards
```

#### Key Files

**1. `src/pages/Index.tsx`** (Main landing page)
- Hero section with video backgrounds
- Features showcase
- Telegram feed integration
- Intersection Observer animations

**2. `src/components/TelegramChannelFeed.tsx`** (Feed logic)
- Fetches posts from backend
- Manages infinite scroll
- Handles layout switching (grid/list)
- Implements image retry logic
- Polls for new posts every 60 seconds
- Shows "new posts available" notification

**3. `src/components/TelegramPostCard.tsx`** (Post card UI)
- Displays individual post with avatar, text, media
- Lightbox for images
- Link to original Telegram post
- Text expansion for long content

**4. `src/components/TelegramChannelHeader.tsx`** (Channel info)
- Displays channel name, avatar, description
- Subscriber count

**5. `src/components/TelegramQRWidget.tsx`** (QR code)
- Generates QR code for Telegram bot
- Uses `qrcode.react` library

#### State Management

**TelegramChannelFeed Component State**:
```typescript
const [posts, setPosts] = useState<TelegramPost[]>([])        // Current posts
const [channelInfo, setChannelInfo] = useState<ChannelInfo>()  // Channel metadata
const [isLoading, setIsLoading] = useState(true)               // Initial load
const [error, setError] = useState<string | null>(null)        // Error state
const [hasMore, setHasMore] = useState(true)                   // Pagination
const [offset, setOffset] = useState(0)                        // Current page
const [isFetchingMore, setIsFetchingMore] = useState(false)    // Loading more
const [newPostsAvailable, setNewPostsAvailable] = useState(false) // New posts notification
const [imageErrors, setImageErrors] = useState<Record<string, number>>({}) // Retry count
const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set()) // Failed images
```

### Backend Architecture (Supabase Edge Functions)

#### Edge Function 1: `tg-channel-feed`
**Location**: `supabase/functions/tg-channel-feed/index.ts`

**Purpose**: Scrapes Telegram channel and returns posts as JSON

**Flow**:
1. Receives request with `channelUsername` and optional `offset`
2. Constructs URL: `https://t.me/s/${channelUsername}?before=${offset}`
3. Fetches HTML from Telegram's public channel page
4. Parses HTML using regex patterns to extract:
   - Post ID, text, date, link
   - Media URLs (images/videos)
   - Channel info (name, avatar, description, subscribers)
5. Returns JSON response with posts array and channel info

**Key Functions**:
```typescript
// Main handler
Deno.serve(async (req) => { ... })

// HTML parsing
function parseChannelHTML(html: string, channelUsername: string) {
  // Extracts post data from HTML
}

// Media URL extraction
const mediaMatch = postHtml.match(/image:url\('([^']+)'\)/)
```

**Caching**: 
- Response includes `Cache-Control: public, max-age=60`
- Reduces load on Telegram servers

#### Edge Function 2: `tg-image-proxy`
**Location**: `supabase/functions/tg-image-proxy/index.ts`

**Purpose**: Proxies Telegram images to bypass CORS and referrer restrictions

**Flow**:
1. Receives request with `url` query parameter
2. Validates URL is from allowed Telegram CDN hosts
3. Fetches image from Telegram with `Referer: https://t.me/`
4. Streams response back to client with appropriate headers

**Security**:
```typescript
const allowedHosts = [
  'cdn4.telegram-cdn.org',
  'cdn5.telegram-cdn.org',
  // ... more CDN hosts
]

if (!allowedHosts.includes(url.hostname)) {
  return new Response('Invalid image URL', { status: 400 })
}
```

**Headers**:
- `Access-Control-Allow-Origin: *` (CORS)
- `Cache-Control: public, max-age=86400` (24-hour cache)
- `Content-Type: image/*`

---

## Telegram Feed System

### How Posts are Fetched

1. **Initial Load**:
   ```typescript
   const response = await fetch(
     `${SUPABASE_URL}/functions/v1/tg-channel-feed?channelUsername=nextwife_ai`
   )
   ```

2. **Backend Scraping**:
   - Edge function fetches `https://t.me/s/nextwife_ai`
   - Parses HTML for post data
   - Returns JSON

3. **Pagination**:
   ```typescript
   const response = await fetch(
     `${SUPABASE_URL}/functions/v1/tg-channel-feed?channelUsername=nextwife_ai&offset=10`
   )
   ```
   - `offset` is the ID of the last post
   - Backend uses `?before=${offset}` parameter

4. **Polling for New Posts**:
   - Every 60 seconds, fetches latest posts
   - Compares with current posts
   - Shows notification if new posts found

### HTML Parsing Details

The backend uses regex to extract data from Telegram's HTML:

**Post Container**:
```regex
/<div[^>]+class="[^"]*tgme_widget_message(?:\s|")[^>]*data-post="[^"]*\/(\d+)"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]+class="[^"]*tgme_widget_message|$)/g
```

**Post Text**:
```regex
/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/
```

**Post Date**:
```regex
/<time[^>]+datetime="([^"]+)"/
```

**Media URL**:
```regex
/image:url\('([^']+)'\)/
```

**Channel Avatar**:
```regex
/<img[^>]+class="tgme_channel_info_header_username_userpic"[^>]+src="([^"]+)"/
```

---

## Image Loading & Retry Mechanism

### 3-Tier Fallback System

The feed implements a sophisticated image loading system with 3 attempts:

#### Attempt 1: Direct Load
```typescript
src={post.media}
```
- Loads image directly from Telegram CDN
- Uses `referrerPolicy="no-referrer"` to avoid referrer blocks

#### Attempt 2: Retry Direct Load (200ms delay)
```typescript
setTimeout(() => {
  setImageErrors(prev => ({ ...prev, [key]: 1 }))
}, 200)
```
- Waits 200ms and retries same URL
- Handles transient network issues

#### Attempt 3: Proxy Load (500ms delay)
```typescript
const buildSrc = (media: string, key: string): string => {
  const attempts = imageErrors[key] || 0
  if (attempts < 2) return media
  
  const encodedUrl = encodeURIComponent(media)
  return `${SUPABASE_URL}/functions/v1/tg-image-proxy?url=${encodedUrl}`
}
```
- Uses `tg-image-proxy` edge function
- Bypasses CORS and referrer restrictions
- Adds proper headers

#### Attempt 4: Hide Image
```typescript
setTimeout(() => {
  setHiddenIds(prev => new Set(prev).add(key))
}, 500)
```
- After 3 failed attempts, hides the image
- Prevents broken image icons

### Image Loading Optimization

**Lazy Loading**:
```typescript
<img loading="lazy" />
```
- Images load only when near viewport
- Reduces initial page load time

**Error Handling**:
```typescript
onError={() => {
  const attempts = imageErrors[key] || 0
  if (attempts < 2) {
    setTimeout(() => {
      setImageErrors(prev => ({ ...prev, [key]: attempts + 1 }))
    }, attempts === 0 ? 200 : 500)
  } else {
    setTimeout(() => {
      setHiddenIds(prev => new Set(prev).add(key))
    }, 500)
  }
}}
```

---

## Development Workflow

### Common Commands

**Start dev server**:
```bash
npm run dev
```

**Build for production**:
```bash
npm run build
```

**Preview production build**:
```bash
npm run preview
```

**Type checking**:
```bash
npx tsc --noEmit
```

**Lint code**:
```bash
npm run lint
```

### Making Changes

#### Changing Telegram Channel

Edit `src/pages/Index.tsx`:
```typescript
<TelegramChannelFeed 
  channelUsername="your_channel_name"  // Change this
  refreshInterval={60000}
  maxPosts={50}
  layout="grid"
/>
```

#### Customizing Feed Layout

**Switch default layout** in `src/pages/Index.tsx`:
```typescript
layout="list"  // or "grid"
```

**Modify grid columns** in `src/components/TelegramChannelFeed.tsx`:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
  {/* Change grid-cols-X values */}
</div>
```

#### Adjusting Polling Interval

In `src/pages/Index.tsx`:
```typescript
refreshInterval={60000}  // milliseconds (60000 = 1 minute)
```

#### Modifying Image Retry Delays

In `src/components/TelegramChannelFeed.tsx`:
```typescript
setTimeout(() => {
  setImageErrors(prev => ({ ...prev, [key]: attempts + 1 }))
}, attempts === 0 ? 200 : 500)  // Change these values
```

### Hot Module Replacement (HMR)

Vite provides instant updates without full page reload:
- CSS changes apply immediately
- React components hot-reload preserving state
- If state breaks, page auto-reloads

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors

**Problem**: Import paths not resolving

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

Check `tsconfig.json` has correct path mapping:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 2. Port 8080 already in use

**Problem**: Another process is using port 8080

**Solution**:
```bash
# Find and kill process on port 8080
# On Mac/Linux:
lsof -ti:8080 | xargs kill -9

# On Windows:
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Or change port in vite.config.ts:
export default defineConfig({
  server: { port: 3000 }
})
```

#### 3. Environment variables not loading

**Problem**: `VITE_SUPABASE_URL` is undefined

**Solution**:
1. Verify `.env` file exists in project root
2. Restart dev server (env vars load on startup)
3. Check variable names start with `VITE_`
4. Access with `import.meta.env.VITE_SUPABASE_URL`

#### 4. Telegram feed not loading

**Problem**: Feed shows "Failed to load channel feed"

**Debugging Steps**:
1. Open browser DevTools → Network tab
2. Look for failed requests to `/functions/v1/tg-channel-feed`
3. Check response:
   - **404**: Edge function not deployed
   - **500**: Server error (check edge function logs)
   - **CORS error**: Missing CORS headers

**Solution**:
- Verify Supabase credentials in `.env`
- Check edge functions are deployed
- Test edge function directly:
  ```bash
  curl "https://ecixveojhujzzawhxmrf.supabase.co/functions/v1/tg-channel-feed?channelUsername=nextwife_ai"
  ```

#### 5. Images not loading

**Problem**: Images show broken icon or don't appear

**Debugging**:
1. Open DevTools → Console
2. Look for failed image requests
3. Check Network tab for failed loads

**Common Causes**:
- **Referrer Policy**: Telegram blocks some referrers
  - Solution: Uses `referrerPolicy="no-referrer"`
- **CORS Issues**: Direct load fails
  - Solution: Proxy kicks in on 3rd attempt
- **Invalid URLs**: Media URL is malformed
  - Solution: Check backend parsing logic

#### 6. Videos not playing

**Problem**: Hero section videos don't play

**Solution**:
- Check video files exist in `public/videos/`
- Verify video format (MP4 H.264 codec)
- Check browser console for errors
- Try different browser (Safari has strict autoplay policies)

Required video attributes:
```tsx
<video autoPlay muted loop playsInline />
```

#### 7. Infinite scroll not working

**Problem**: More posts don't load when scrolling

**Debugging**:
1. Check `hasMore` state (should be `true`)
2. Verify `handleScroll` is attached to correct element
3. Check backend returns posts with valid IDs

**Solution**:
```typescript
// Ensure scroll listener is attached
useEffect(() => {
  const element = layout === 'grid' 
    ? feedSectionRef?.current 
    : scrollContainerRef.current
    
  element?.addEventListener('scroll', handleScroll)
  return () => element?.removeEventListener('scroll', handleScroll)
}, [layout, hasMore, isFetchingMore])
```

#### 8. TypeScript errors

**Problem**: Type errors in editor or build

**Solution**:
```bash
# Check all type errors
npx tsc --noEmit

# Common fixes:
# - Install missing type definitions
npm install --save-dev @types/node

# - Regenerate types (if using Supabase)
# Types are auto-generated, don't edit manually
```

#### 9. Build fails

**Problem**: `npm run build` errors

**Common Issues**:
- Unused imports: Remove them
- Type errors: Fix or use `// @ts-ignore` (not recommended)
- Missing dependencies: `npm install`

**Solution**:
```bash
# Clean build
rm -rf dist
npm run build

# Check specific error and fix
```

#### 10. Styling not applying

**Problem**: Tailwind classes don't work

**Solution**:
1. Verify `tailwind.config.ts` includes all content paths:
   ```typescript
   content: [
     "./index.html",
     "./src/**/*.{js,ts,jsx,tsx}",
   ]
   ```
2. Check `index.css` imports Tailwind:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
3. Restart dev server

#### 11. Infinite loop / Memory leak

**Problem**: Page freezes or crashes

**Debugging**:
- Open DevTools → Performance tab
- Record and check for recursive calls
- Check `useEffect` dependencies

**Common Cause**: Missing dependencies in `useEffect`:
```typescript
// BAD - will loop infinitely
useEffect(() => {
  fetchData()
}, []) // missing fetchData dependency

// GOOD - use useCallback
const fetchData = useCallback(() => { ... }, [])
useEffect(() => {
  fetchData()
}, [fetchData])
```

---

## Advanced Topics

### Performance Optimization

#### Current Optimizations

1. **Lazy Loading Images**:
   ```typescript
   <img loading="lazy" />
   ```

2. **Video Preload**:
   ```tsx
   <video preload="auto" />
   ```

3. **Memoization** (not yet implemented):
   ```typescript
   const PostCard = React.memo(TelegramPostCard)
   ```

4. **Virtualization** (not yet implemented):
   ```bash
   npm install react-window
   ```

5. **Debounced Scroll**:
   - Scroll handler only triggers when scrolled within 200px of bottom

6. **Backend Caching**:
   - Edge functions cache responses for 60 seconds

7. **Staggered Animations**:
   ```typescript
   style={{ 
     animationDelay: `${index * 0.1}s` 
   }}
   ```

#### Further Optimizations

**1. Use React.memo for expensive components**:
```typescript
export const TelegramPostCard = React.memo(({ post, channelInfo }) => {
  // Component logic
}, (prevProps, nextProps) => {
  return prevProps.post.id === nextProps.post.id
})
```

**2. Implement virtual scrolling**:
```bash
npm install react-window
```

**3. Optimize bundle size**:
```bash
npm run build -- --mode production

# Analyze bundle
npm install --save-dev vite-plugin-bundle-analyzer
```

**4. Add service worker for offline support**:
```bash
npm install workbox-window
```

### Deployment

#### Build for Production

```bash
# Create optimized build
npm run build

# Output in ./dist directory
```

#### Deploy to Vercel/Netlify

**Vercel**:
```bash
npm install -g vercel
vercel deploy --prod
```

**Netlify**:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Environment Variables in Production

Add these to your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

#### Edge Functions

Edge functions are deployed separately to Supabase:
- They run on Supabase infrastructure (Deno runtime)
- Must be deployed via Supabase CLI or Lovable dashboard
- Not included in frontend build

---

## Project Structure Reference

```
project-root/
├── public/
│   ├── videos/           # Hero section videos
│   ├── fonts/            # Custom fonts
│   └── favicon.jpeg      # Site icon
├── src/
│   ├── assets/           # Images, logos
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── TelegramChannelFeed.tsx
│   │   ├── TelegramPostCard.tsx
│   │   ├── TelegramChannelHeader.tsx
│   │   └── TelegramQRWidget.tsx
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Supabase client
│   │   └── supabase/
│   │       └── client.ts
│   ├── lib/              # Utility functions
│   ├── pages/            # Route components
│   │   ├── Index.tsx     # Main landing page
│   │   └── NotFound.tsx  # 404 page
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles + Tailwind
├── supabase/
│   ├── functions/        # Edge functions
│   │   ├── tg-channel-feed/
│   │   │   └── index.ts  # Telegram scraper
│   │   └── tg-image-proxy/
│   │       └── index.ts  # Image proxy
│   └── config.toml       # Supabase config
├── .env                  # Environment variables
├── package.json          # Dependencies
├── tailwind.config.ts    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite configuration
```

---

## Conclusion

You now have a complete understanding of how to run this project locally. The key components are:

1. ✅ **Install Node.js and dependencies**
2. ✅ **Configure environment variables**
3. ✅ **Run `npm run dev`**
4. ✅ **Understand the architecture**
5. ✅ **Know how to debug issues**

For any issues not covered here, check:
- Browser console for errors
- Network tab for failed requests
- Edge function logs in Supabase dashboard

Happy coding! 🚀
