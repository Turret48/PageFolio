# Pagefolio — Build Plan

Ordered build steps. Complete each fully before starting the next.

**Progress as of 2026-05-01: Steps 1–7 ✅ — next is Step 8.**

---

### Step 1 — Project initialization
Initialize a Next.js 14 project with TypeScript, Tailwind CSS, and App Router. Install dependencies:
```
@supabase/supabase-js @supabase/ssr
drizzle-orm drizzle-kit postgres
@ai-sdk/anthropic ai
zustand
@tanstack/react-query
reactflow
@zxing/browser
zod
```
Set up the folder structure as defined in `docs/folder-structure.md`.

---

### Step 2 — Database + auth clients
Set up Drizzle ORM with the full schema from `docs/schema.md`. Create `src/lib/db/schema.ts` with all tables. Generate the initial migration. Set up `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts`.

---

### Step 3 — Auth pages
Set up Supabase auth with email/password. Create login and signup pages at `app/(auth)/login` and `app/(auth)/signup` using the Pagefolio design system. On successful auth redirect to `/library`. Add a Supabase trigger to auto-create a `profiles` row on new user signup.

---

### Step 4 — App shell
Build the app shell layout at `app/(app)/layout.tsx` with a bottom nav bar for mobile (Library, Graph, Rooms, Profile tabs — Cayenne for active state) and a sidebar for desktop. Use the Pagefolio color palette and typography.

---

### Step 5 — Library page
Build the library page at `app/(app)/library/page.tsx`. Show a Currently Reading featured card (Cayenne background, serif title, 4-bar phase progress, Continue button) and a 2-column book grid below. Include an Add Book button.

---

### Step 6 — Add Book dialog
Build the Add Book dialog. Search Google Books via `/api/books/search` (proxy, nonfiction filter). Display results as a cover grid. Support ISBN/barcode scanning via `@zxing/browser`. On book select, call `/api/books/add`.

---

### Step 7 — Orient phase
Build the Orient phase page and API route. Stream AI summary and big ideas using the Vercel AI SDK and the Orient prompt. Cache results on the `books` row. On completion, create `concept_nodes` from `big_ideas` and mark orient complete in `user_progress`.

---

### Step 8 — Reflect phase
Build the Reflect phase as a chat interface. Stream AI responses using the Reflect prompt. Save the full conversation to `user_progress.reflect_messages`. On conversation completion, generate and save `insight_card_text`.

---

### Step 9 — Insight card + sharing
Build `InsightCardPreview`. After Reflect completes, show the user their insight card with options to edit the text, then choose which Reading Rooms to share it to (or keep private). Only call `/api/rooms/share` after explicit user confirmation.

---

### Step 10 — Act phase
Build the Act phase. Stream the goal-setting conversation using the Act prompt. Allow up to 3 goals per book. Save goals to `user_goals` with `target_date`. Show pending goals on next app open with a gentle nudge if past target date.

---

### Step 11 — Knowledge graph
Build the knowledge graph page using React Flow. Fetch the user's `concept_nodes` and accepted `concept_edges`. Render nodes colored by theme, sized by edge count. Show AI-suggested edges with accept/dismiss UI. Only show if user has 2+ books with orient completed.

---

### Step 12 — Reading Rooms
Build Reading Rooms. Create/join via invite code. Room view shows shared insight cards and the goal wall with witness acknowledgments. All sharing is explicit opt-in only.

---

### Step 13 — Monthly review
Build the monthly review. Generate on first open of a new month if prior month had activity. 7 swipeable slides using the slide components in `components/review/slides/`. Generate a unique `share_token` and build the public share page at `/review/[token]` (no auth required).
