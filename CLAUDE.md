# Pagefolio — AI Steering File

## Project Overview
Pagefolio is a nonfiction reading companion mobile app for curious professionals (target: 30–55 year olds). Core promise: **reading that actually sticks**. Each book flows through 4 phases — Orient, Reflect, Connect, Act — building a personal knowledge graph and setting follow-through goals.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Auth + DB**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM (type-safe queries, migrations)
- **AI**: Vercel AI SDK + Anthropic `claude-sonnet-4-20250514`
- **Client state**: Zustand
- **Server state / caching**: TanStack Query (React Query)
- **Graph visualization**: React Flow
- **Styling**: Tailwind CSS
- **Barcode scanning**: @zxing/browser (ISBN scanning)
- **Email**: Resend (transactional)

## Design System

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| Background (Snow) | `#F8F2F5` | Page background |
| Card surface | `#FFFFFF` | All card surfaces |
| Primary accent (Cayenne) | `#E55812` | CTAs, active states, progress fill |
| Primary text (Ink) | `#1A1210` | All body + heading text |
| Muted text | `#B0A8A4` | Secondary labels, captions |
| Border | `#EDE8E6` | All card/input borders |

**Cayenne `#E55812` is used ONLY for:** active states, primary CTAs, current book feature card, phase progress fill, nav active state, avatar background. Do not use it decoratively.

#### Knowledge Graph Node Themes
| Category | Background | Text | Border |
|---|---|---|---|
| Mindset | `#FDF0E8` | `#9A5020` | `#F4D8C0` |
| Systems | `#E9FAE3` | `#3A6A30` | `#C8E8BE` |
| Relationships | `#EEE8F8` | `#5A3A8A` | `#D8CCF0` |
| Performance | `#FFF5E0` | `#8A6010` | `#F0DCA0` |
| Creativity | `#FDE8F0` | `#8A2050` | `#F0C0D4` |

### Typography
- **Display / headings**: Playfair Display (serif) — 400, 500, 600
- **Body / UI**: Inter — 400, 500
- **Scale**: h1 28px · h2 22px · h3 18px · h4 15px
- **Body**: 15px / line-height 1.6
- **Section labels**: 11px, uppercase, letter-spacing 0.06em, color `#B0A8A4`

### Component Rules
- **Border radius**: 12px cards · 20px pill buttons · 16px featured cards · 32px mobile shell
- **Borders**: 0.5px solid `#EDE8E6` on all card surfaces
- **No drop shadows** — use subtle focus rings only
- **Phase progress**: 4 horizontal bars per book card — Cayenne filled, `#EDE8E6` empty

### Layout
- **Mobile-first**: design for 390px viewport, scale up
- **Book grids**: 2-column on mobile · 3-4 on tablet/desktop
- **Navigation**: bottom nav bar on mobile · sidebar on desktop
  - Tabs: Library · Graph · Rooms · Profile
- **Phase flows**: full-screen vertical on mobile
- **Monthly review**: swipeable card slides

## Core Reading Flow (per book)
1. **Orient** — Frame what you're reading and why
2. **Reflect** — Capture insights and reactions
3. **Connect** — Link ideas to your knowledge graph
4. **Act** — Set concrete follow-through goals

## Database

Full schema reference: [`docs/schema.md`](docs/schema.md)

Key facts for day-to-day work:
- `books` rows are **shared across users** — `summary` and `big_ideas` are AI-generated once and cached at the book level
- `user_progress` is the source of truth for phase state and Reflect conversation history (`reflect_messages` jsonb)
- `concept_nodes.book_id` is nullable — null means user created a standalone node not tied to a book
- `room_insight_shares` is **explicit opt-in** — no automatic sharing ever
- Freemium limit enforced in app logic via `profiles.freemium_book_limit` (default 5) before inserting into `user_books`
- RLS is enabled on **every table** — always write queries assuming the authenticated user context
- Migrations live in `db/migrations/`; never edit the schema without a migration

## Folder Structure

Full structure in [`docs/folder-structure.md`](docs/folder-structure.md). Key landmarks:

```
src/
  app/(auth)/          ← Login, signup
  app/(app)/           ← Authenticated app shell + all feature pages
  app/api/             ← API routes (books, chat, graph, rooms, review)
  components/ui/       ← Base design system components
  components/phases/   ← Phase-specific views (Orient, Reflect, Connect, Act)
  lib/db/schema.ts     ← Single source of truth for Drizzle schema
  lib/ai/prompts.ts    ← All AI system prompts
  lib/supabase/        ← client.ts (browser) + server.ts (server)
  stores/              ← Zustand stores
  hooks/               ← TanStack Query hooks
```

## API Routes

Full specs in [`docs/api-routes.md`](docs/api-routes.md). Summary:

| Route | Method | Description |
|---|---|---|
| `/api/books/search` | POST | Google Books proxy, nonfiction filter |
| `/api/books/add` | POST | Add book, enforce freemium, create progress row |
| `/api/chat/[bookId]/[phase]` | POST | AI streaming — all 4 phases |
| `/api/graph/suggest` | POST | AI edge suggestions for Connect phase |
| `/api/rooms/create` | POST | Create reading room |
| `/api/rooms/join` | POST | Join via invite code |
| `/api/rooms/share` | POST | Explicit insight card share with preview |
| `/api/review/generate` | POST | Monthly review generation (background fn, 60s max) |

## Development Conventions

### Code
- TypeScript strict mode throughout
- Use App Router conventions (server components by default, `"use client"` only when needed)
- All Supabase **server** calls use `src/lib/supabase/server.ts`; **browser** calls use `src/lib/supabase/client.ts`
- All API routes verify the Supabase user first before any DB operation
- Drizzle for all DB queries — no raw SQL
- All AI calls go through Vercel AI SDK; model is `claude-sonnet-4-20250514`; prompts in `src/lib/ai/prompts.ts`
- Zustand for ephemeral UI state only; persistent data via TanStack Query + Supabase
- TanStack Query key conventions: `['library', userId]`, `['progress', bookId]`, `['graph', userId]`, `['goals', bookId]`
- Tailwind utility classes preferred; avoid custom CSS unless unavoidable
- No inline styles except dynamic values (e.g., graph node colors)
- All forms validated with Zod before hitting the DB
- Never commit secrets — all keys in `.env.local` only

### Git
- Create a new branch for each feature; never commit directly to `main`
- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`

### Phase Rules
- Phases unlock sequentially: orient → reflect → connect → act
- Completed phases can always be revisited
- Connect phase only shows after user has 2+ books with orient completed
- Nothing is shared to Reading Rooms without explicit user opt-in and preview

### Freemium
- Free tier: 5 books max (`profiles.freemium_book_limit` default 5)
- Enforce at `/api/books/add` — return 403 with upgrade message if at limit
- No paywall UI yet — just enforce the cap with a friendly message
