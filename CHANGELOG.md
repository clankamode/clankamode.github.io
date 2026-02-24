# Changelog

Week-over-week overview of features shipped.

---

## Week of Feb 17 – Feb 23, 2026

### Progress Dashboard & Performance
- Merged progress dashboard into own-profile view behind `PROGRESS_TRACKING` flag (#188)
- Activity heatmap card on the progress page (#183)
- Parallelized `getSessionState` to eliminate duplicate fetches and sequential waterfalls (#187)
- Parallelized `sessionState` and primer fetches on the home page (#186)
- Cached static pillar/article fetches with `unstable_cache` (#185)
- Collapsed N+1 topic/article queries into a single join (#184)

### AI Tutor (WIP)
- Article context extractor for AI tutor prompt building
- Tutor system prompt builder with Socratic teaching rules
- `TutorConversations` migration (bigint FKs, correct schema)

### Stream Mode & Admin
- Stream Mode UI and admin features (#172)
- "Ask me anything" during stream (#168)
- Admin feedback management dashboard (#164)
- Admin dashboard (#163)

### Brand & Identity
- JP logo added to Navbar (#179, #180)

### Public Profiles
- Public profile page with badges, stats, and submission history (#158)

### Feature Flags & Sessions
- 37 unit tests for role-restricted flag access control (#176)
- Role-restricted flags now require role even when `defaultValue: true` (#175)
- Unified intent-driven session flow and hardened local runtime (#174)
- Gated first-run welcome flow behind session rollout (#171)

### Data Quality & Tooling
- Seed data: interview questions, articles, and null slug fixes (#178)
- Aligned local dev users with prod roles (#177)
- Converted reusable workflows into first-class skills (#155)

### Fixes
- Full question titles on mobile for Peralta 75 (#181)
- YouTube count formatting and article chunking logic (#182)
- Correct test case for Diagonal Traverse II (#167)
- Restored grid layout on pillar page to prevent mobile overflow (#160)
- Removed name from navbar when logged out (#161)
- Allow lg Button to grow vertically on mobile (#157)
- Baseline schema migration for pre-existing tables (#153)
- Migrated hardcoded colors to semantic tokens for light mode support (#154)

---

## Week of Feb 10 – Feb 16, 2026

### Session Intelligence
- Transfer Score v0, admin hub, personalization A/B (#144)
- Session repeat cooldown and progress writeback on finalize (#138)
- Session finalize durability on tab hide/unload + Discord UserFeedback webhook (#131)
- Session progression integrity and concept stats writeback (#127)
- Session planner ranking diversity and anti-repetition (#134)

### AI Policy OS
- AI Policy OS v1: planner, scope, onboarding, triage (#145)
- AI decision registry and replay pipeline for friction triage (#141)

### Admin & Monitoring
- Admin friction monitor and session intelligence dashboard (#140)
- Admin nav link for session quality dashboard (#139)
- Admin-only friction intelligence in silent mode (#135)
- Daily 9 AM admin brief email cron with site metrics (#112)
- Discord notifications for new user signups (#110)

### Onboarding & Roles
- First-login welcome flow with goal, plan, and launch (#143)
- Introduced `INSIDER` role and assigned to early access users (#142)

### Practice & Content
- "Implement Data Structures from Scratch" practice mode (#125)
- Store practice questions in DB (#126, #136)
- Authoritative reading surface & enriched AI context (#122)
- Session article chunking, timer, practice items, assessment flow, gate/exit UX (#119)

### Peralta 75 & Assessments
- Peralta 75 v2 (#118)
- Mock Assessments v2 (#117)
- Python editor with client-side WebAssembly execution (#115)
- Improvements to Peralta 75 and assessments (#123)
- Feedback system, practice editor fixes, session bugs (#121)

### Voice & Blog
- Voice-to-draft blog authoring flow in admin editor (#107)
- Session Excellence: receipt & primer loop (#106)
- Logged-in home v1: session mode, O2/O3 intent, proposals, exit ritual, telemetry (#95)
- Cursor rules for consistent blog post creation (#114)

### Infrastructure
- Supabase DB backup to S3 (#148)
- Daily brief cron updated to 11:59 PST (#146)
- Filter E2E tests from telemetry (#113)
- "Sign in required" instead of "Premium" gating (#124)
- Goat Latin database corruption regression test (#128)

### Fixes
- Blog horizontal line margin (#111)
- Removed forced white text on hover for article cards and nav

---

## Week of Feb 3 – Feb 9, 2026

### Home & Sessions
- Logged-in home v1: session mode, O2/O3 intent & proposals, exit ritual, telemetry, auth/API hardening (#95)

### Progress Tracking
- Learning progress tracker with feature flags (#92)

### Fixes
- Video search bar padding (#93)

---

## Week of Jan 27 – Feb 2, 2026

### AI Chat
- Unified chat UI into structural timeline system (#88)
- Turn-based components: TurnCard, TurnStack, TurnRenderer, ArtifactCard, TextCard
- ModelSelector, EmptyStateCreate; removed MessageBubble/MessageList

### Blog
- Launched the engineering blog (#87)

### Admin
- Refined Thumbnail Manager UI and fixed admin navbar (#90)

### Dependencies
- Dependency cleanup and core upgrades (#86)
- OpenAI SDK upgraded from v5 to v6 (#83)

### Fixes
- Video card text readability (#85)

---

## Week of Jan 20 – Jan 26, 2026

### Learning Platform
- Learning Platform V1 with OpenAI-inspired content experience (#63)
- Restricted learn section to admin users only (#64)
- Block-based learning editor with media tools (#66)
- Enhanced block editor UX and polish (#68)
- Fix block insert popup positioning and Text button in toolbar (#72)
- Content library UX improvements (#70)

### Editor & Thumbnails
- Editor dropdown with Thumbnails, Gallery, and Clips (#55)
- Comments sidebar on thumbnail modal (#61)
- Favorites tab and per-thumbnail toggles (#56)
- Three thumbnail suggestion variants (inspiration + text-overlay) (#58)
- Refined thumbnail suggestion generation (#52)
- Moved AI Tools to Editor Nav (#59)
- Scrollable comments in thumbnail modal (#78)
- Flow-first editor & AI summary integration (#77)

### Testing
- E2E tests for block editor (#75)
- Test coverage for resume templates with authentication (#73)

### Design System
- Design system redesign (#46)
- Aligned design system with DESIGN_PRINCIPLES.md (#62)
- Comprehensive design principles documentation (#47)
- FAANG level styling set to red (#51)
- Increased font sizes and improved video section UX (#57)

### Infrastructure
- Agent infrastructure: skills & workflows (#76)
- Next.js build cache in CI (#82)
- YouTube API quota handling and dev mode cache (#65)
- Resume templates download section (#69)
- Login-to-access gate with animation
- Navbar centering fix

### Fixes
- Library article count and duplicate summary display (#81)
- Removed mobile auth and YouTube subscribe CTAs (#50)
- ChatInterface refactor: 1650 to 660 lines (#48)

---

## Week of Jan 13 – Jan 19, 2026

### Assessments
- Assessment page with auth-gated question fetch (#44)
- Assessment UI fixes

### Design
- Setup and documentation improvements (#45)

### Ratings
- LeetCode rating updated to 1679 (#43)
- Codeforces rating updates (#42, #49)

---

## Week of Jan 6 – Jan 12, 2026

- AI tutorial modal starter flow (#38)
- LeetCode and Codeforces ratings added to hero section (#40)
- Gallery images switched to 16:9 aspect ratio (#39)

---

## Week of Dec 1 – Dec 7, 2025

- Fix paragraph rendering in blog posts
- Increased image generation timeout (#35)

---

## Week of Nov 24 – Nov 30, 2025

### AI Chat
- Updated chat endpoint to use OpenAI Responses API (#29)
- Added GPT-5 support
- OpenAI RAG responses for chat streaming (#26)
- Markdown rendering in chat messages (#24)
- Backslash system prompt picker for chat (#25)
- Image and PDF uploads in chat (#22)
- Improved mobile chat layout responsiveness (#28)

### Live Streams
- Live Q&A questions with Supabase real-time voting (#32)

### Editor
- Improved editor view (#20)
- Gallery tab for headshot uploads (#33)
- Image generation with Google API (#34)

### Admin
- Activity tracking for thumbnail jobs (#30)
- Admin proxy impersonation controls (#23)

---

## Week of Nov 17 – Nov 23, 2025

### AI Chat
- Created AI tab with chat interface (#13)

### Practice & Assessments
- Practice test creation with DB-backed questions (#9)
- Answer-on-the-fly mode for assessments (#10)
- Session logic improvements: only re-ask incorrect questions
- Knowledge area and unit filtering (#11)
- Session result improvements

### Thumbnail Manager
- Tools section with modals instead of redirects (#7, #8)
- Fixed thumbnail aspect ratio

### Admin
- Scripts section for ad-hoc data operations
- Analytics integration

---

## Week of Sep 1 – Sep 7, 2025

- Fact checker and timestamp generator tools

---

## Week of Aug 25 – Aug 31, 2025

- Serve unoptimized images for faster loads
- Download button added to pages

---

## Week of Aug 18 – Aug 24, 2025

### User Management
- Moved user roles to database (#3)
- Removed hardcoded mocks tab

### Scripts & Automation
- Ad-hoc scripts for video data management (#4)
- Cron job for automated YouTube data sync (#6)
- Reduced landing page API calls (#5)

### Content
- Total hours of content displayed on homepage
- Fixed mobile view layout

---

## Week of Jul 21 – Jul 28, 2025

### Thumbnail Manager
- Thumbnail upload feature merged (#2)
- Added editor role support

---

## Week of Jun 23 – Jun 28, 2025

### Thumbnail Manager
- Thumbnail status workflow (move between statuses)
- Bug fixes and sorting by updated_at

---

## Week of Jun 16 – Jun 22, 2025

### Thumbnail Manager
- Thumbnail overview page with job creation
- Database-backed thumbnail storage
- Thumbnail modal with back navigation
- Side navigation extracted as shared component
- Consolidated loading screen
- API endpoints for thumbnail CRUD

### Admin
- Role-based access control for analytics
- Admin-only analytics page

---

## Week of Jun 9 – Jun 15, 2025

- Major feature update (squashed commit)

---

## Week of May 19 – May 24, 2025

- Fixed navbar spacing and padding

---

## Week of Apr 7 – Apr 12, 2025

### Initial Launch
- Project created with Next.js (Create Next App)
- Homepage with channel stats and latest videos
- Infinite scroll for all videos
- YouTube API integration with pagination
- Google OAuth authentication (#auth)
- Navbar and navigation structure
- Playwright E2E test setup
- Code refactoring and lint cleanup
- First deployment
