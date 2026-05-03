# Pagefolio — AI Steering File

Read this file at the start of every session. Follow existing project patterns first.
If anything in these guidelines conflicts with the existing architecture, stop and
explain the conflict before proceeding.

---

## Project Overview
Pagefolio is a nonfiction reading companion mobile app for curious professionals (target: 30–55 year olds). Core promise: **reading that actually sticks**. Each book flows through 4 phases — Orient, Reflect, Connect, Act — building a personal knowledge graph and setting follow-through goals.

---

## Stack
- **Framework**: Next.js 14+ (App Router), TypeScript strict mode
- **Auth + DB**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM — schema lives in `src/lib/db/schema.ts`
- **AI**: Vercel AI SDK + Anthropic `claude-sonnet-4-6`
  - API key is stored as `PAGEFOLIO_AI_KEY` in `.env.local` (NOT `ANTHROPIC_API_KEY` — Claude Code injects an empty `ANTHROPIC_API_KEY` that overrides `.env.local`, so the project uses a different name)
  - Claude Code also injects `ANTHROPIC_BASE_URL=https://api.anthropic.com` (missing `/v1`), causing 404s
  - Always use `createAnthropic({ apiKey: process.env.PAGEFOLIO_AI_KEY!, baseURL: 'https://api.anthropic.com/v1' })`
- **Client state**: Zustand
- **Server state / caching**: TanStack Query (React Query)
- **Graph visualization**: React Flow
- **Styling**: Tailwind CSS
- **Barcode scanning**: @zxing/browser (ISBN scanning)
- **Email**: Resend (transactional)
- **All AI prompts**: `src/lib/ai/prompts.ts`

---

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
- **Section labels**: 10px, uppercase, letter-spacing 0.09em, color `#B0A8A4`

### Component Rules
- **Mobile-first always** — design for 390px viewport, scale up to desktop
- **Border radius**: 12px cards · 20px pill buttons · 16px featured cards · 32px mobile shell
- **Borders**: 0.5px solid `#EDE8E6` on all card surfaces
- **No drop shadows** — use borders for depth
- **Phase progress**: 4 horizontal bars per book card — Cayenne filled, `#EDE8E6` empty
- Do not make broad visual redesigns unless explicitly requested
- Do not introduce a new styling library without asking

### Layout
- **Book grids**: 2-column on mobile · 3-4 on tablet/desktop
- **Navigation**: bottom nav bar on mobile · sidebar on desktop — tabs: Library · Graph · Rooms · Profile
- **Phase flows**: full-screen vertical on mobile
- **Monthly review**: swipeable card slides

---

## Core Reading Flow (per book)
1. **Orient** — Frame what you're reading and why
2. **Reflect** — Capture insights and reactions
3. **Connect** — Link ideas to your knowledge graph
4. **Act** — Set concrete follow-through goals

---

## Database

Full schema reference: [`docs/schema.md`](docs/schema.md)

Key facts for day-to-day work:
- `books` rows are **shared across users** — `summary` and `big_ideas` are AI-generated once and cached at the book level
- `user_progress` is the source of truth for phase state and Reflect conversation history (`reflect_messages` jsonb)
- `concept_nodes.book_id` is nullable — null means user created a standalone node not tied to a book
- `room_insight_shares` is **explicit opt-in** — no automatic sharing ever
- Freemium limit enforced in app logic via `profiles.freemium_book_limit` (default 5) before inserting into `user_books`
- RLS is enabled on **every table** — always write queries assuming the authenticated user context
- Migrations live in `drizzle/migrations/`; never edit the schema without a migration

---

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

---

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

---

## App Rules

### Phase Logic
- Phases unlock sequentially: orient → reflect → connect → act
- Completed phases can always be revisited
- Connect phase only appears after user has 2+ books with orient completed
- Nothing is shared to Reading Rooms without explicit user opt-in and preview — never share automatically

### Freemium
- Free tier: 5 books max (`profiles.freemium_book_limit`, default 5)
- Enforce at `/api/books/add` — return 403 with a friendly message if at limit
- Do not build paywall UI yet — just enforce the cap cleanly

### AI Prompts
- All prompts live in `src/lib/ai/prompts.ts` — do not inline prompts inside route files or components
- Never log full AI responses or user message content
- If a streaming response fails partway through, surface the error clearly — do not silently return partial data as if it were complete
- If an AI response is used to write to the database, validate its structure before inserting — never trust raw AI output as safe DB input
- If a prompt needs to change, update `prompts.ts` and explain what changed and why

---

## Code Organization Rules

### File Structure
- Prefer one exported component per file
- Small private helper components may live in the same file only if: not exported, only used in that file, and the file stays under the line limit
- A file should have one clear responsibility
- If a file is growing beyond ~150 lines, stop and split it before continuing
- Components go in `src/components/` organized by feature folder, not type
  - ✅ `src/components/library/BookCard.tsx`
  - ❌ `src/components/cards/BookCard.tsx`
- Co-locate related files — if a hook, type, or helper is only used by one component, keep it in the same feature folder
- Avoid barrel files (`index.ts` that re-exports everything) unless explicitly requested
- API routes handle routing, auth checks, and validation only — business logic belongs in `src/lib/` or `src/services/`
- If a utility is used in more than one place, move it to the smallest appropriate shared location (`src/lib/date.ts`, `src/lib/formatting.ts`, etc.)
- If a utility is only used once, co-locate it with the feature
- Never put multiple page components, multiple API handlers, or multiple Zustand stores in one file

### File Length Guidance
- UI components: aim for under 100 lines, hard stop at 150
- API routes: aim for under 80 lines, hard stop at 120
- Schema files: allowed to be longer — split by table group if over 300 lines
- Store files: one store per domain, under 100 lines each
- If a file needs to exceed these limits, stop and explain why before proceeding

---

## Naming Conventions
- PascalCase for React components
- camelCase for functions, variables, hooks, and Zustand stores
- `useX` naming for all hooks
- Descriptive file names that match the primary export
- Avoid vague names: Helper, Utils, Data, Manager, Thing
- Prefer domain-specific names: `BookCard`, `useBookFilters`, `formatBookTitle`

---

## Client and Server Boundaries
- Keep server-only logic out of client components
- Do not import database clients, server actions, secrets, or Node-only modules into client components
- Use `"use client"` only when interactivity, browser APIs, or client-side state are required
- Keep data fetching as close to the server as possible unless client-side fetching is specifically needed
- Never expose secrets in client-side code
- Validate authorization on the server, not only in the UI

---

## State Management
- Use local component state for state that only affects one component
- Use URL/search params for shareable filter, search, pagination, and tab state when appropriate
- Use Zustand only for cross-page or cross-feature client state
- Do not put server data into Zustand unless there is a specific reason
- Prefer TanStack Query for server state
- Keep stores focused by domain — do not create one large global store for unrelated state
- TanStack Query key conventions: `['library', userId]` · `['progress', bookId]` · `['graph', userId]` · `['goals', bookId]`

---

## Type Safety and Validation
- Use TypeScript types explicitly at module boundaries
- Validate external inputs at the boundary: API routes, server actions, forms, third-party API responses, raw AI responses before writing to DB
- Prefer Zod for schema validation
- Do not use `any` unless there is no reasonable alternative — if used, explain why
- Do not suppress TypeScript errors with `@ts-ignore` unless clearly justified with a comment
- Prefer `unknown` over `any` when handling uncertain external data
- Keep types close to the feature they belong to unless shared across multiple features

---

## Supabase and RLS
- Always use the server client (`src/lib/supabase/server.ts`) in API routes and server components
- Always use the browser client (`src/lib/supabase/client.ts`) in client components
- Never bypass RLS using the service role client in a user-facing route unless explicitly necessary — if you do, explain why clearly
- Never expose the service role key in client-side code
- If you add a new table, stop and remind me to add RLS policies before considering the task done
- Always verify the Supabase user at the top of every API route before any database operation
- Do not trust client-provided user IDs, roles, ownership flags, or permissions — always verify server-side

---

## Dependencies
- Do not add a new dependency if the project already has a reasonable way to solve the problem
- Ask before adding, removing, or replacing any dependency
- Prefer small, well-maintained libraries over large frameworks for narrow problems
- If a dependency is added, explain why it was needed
- Do not swap libraries without asking first
- Do not upgrade major versions of dependencies unless explicitly requested

---

## Accessibility
- Use semantic HTML before custom ARIA
- Interactive elements must be keyboard accessible
- Buttons should be `<button>`. Links should be `<a>` / `<Link>`.
- Form inputs must have associated labels
- Images need meaningful `alt` text unless decorative
- Do not remove focus outlines unless replacing with a visible accessible focus style
- Avoid clickable `<div>`s unless accessibility behavior is fully handled
- Make loading, error, and empty states understandable to screen readers

---

## Security
- Never expose secrets in client-side code
- Never log tokens, API keys, passwords, session values, or personal user data
- Validate authorization on the server, not only in the UI
- Do not trust client-provided user IDs, roles, prices, ownership flags, or permissions
- Use environment variables through the project's established config pattern
- Do not hardcode secrets, API keys, URLs, or credentials
- If an environment variable is missing, stop and tell me clearly — do not proceed with a fallback or placeholder value

---

## Testing
- Do not add tests unless explicitly asked
- If you think something is complex enough to warrant a test, say so and ask before writing it
- When tests are requested, prefer testing behavior over implementation details
- Do not add tests that simply mirror the code without proving useful behavior

---

## Git
- Create a new branch for each feature; never commit directly to `main`
- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`

---

## Honesty Rules — Issues, Blockers, and Workarounds

This is the most important section. A known problem is always better than a silent workaround.

### When to Stop and Tell Me
- If you hit an API limitation, missing environment variable, or unsupported feature — stop and tell me clearly
- Do not silently substitute a mock, stub, or workaround without flagging it
- If a library does not support what we need, tell me before switching to a different library
- If implementing something the right way is complex and you are considering a simpler shortcut, tell me the tradeoff before taking it
- If you create a temporary placeholder, mock data, stub function, or hardcoded value for any reason, leave a comment: `// TODO: replace — [reason]` and mention it in your response
- If something is not working and you have tried twice without success, stop and describe the problem instead of trying a third approach
- If you find yourself writing more than ~20 lines to work around a problem, stop — that is a sign the underlying issue needs to be solved, not routed around

### Workarounds Are Sometimes Fine — But Must Be Declared
- If a workaround is the right pragmatic choice, say so explicitly: *"I used X workaround here because Y. This should be revisited when Z."*
- Never delete code just to make an error go away — tell me why it is erroring
- Never comment out code silently — explain why in the comment and tell me in your response
- If you leave something incomplete, say so clearly in your response under: **What's left / what to revisit**

### Code Hygiene
- No orphaned files — if you create a file that ends up not being used, delete it and tell me
- No unused imports — clean them up before considering a task done
- No unused variables — remove them or explain why they are needed
- No `console.log` statements in committed code unless intentional debug tools marked with `// DEBUG:`
- If you refactor something, tell me what changed and why, and confirm the old code has been fully removed
- Keep comments useful — do not add obvious comments that repeat what the code already says
- Do not leave dead code behind

---

## End-of-Task Summary

At the end of every task, provide:

1. **What you built or changed**
2. **Any TODOs or placeholders left**
3. **Anything that needs to be revisited or is not production-ready**
4. **Any decisions you made that I should know about**
5. **What checks you ran** (typecheck, lint, etc.)
6. **Any checks you could not run and why**
