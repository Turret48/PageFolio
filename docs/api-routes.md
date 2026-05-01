# Pagefolio — API Route Specs

All routes are under `src/app/api/`. All authenticated routes must verify the Supabase user before any DB operation.

---

## POST `/api/books/search`

Proxies the Google Books API (keeps the API key server-side).

**Query params:**
- `q` — search string (text search)
- `isbn` — barcode scan result (takes priority over `q`)

**Behavior:**
- Filters results to nonfiction only (checks `categories` from Google Books)
- Deduplicates against existing `books` rows by `google_books_id`
- Returns scored candidates

**Response:** `{ books: BookCandidate[] }`

---

## POST `/api/books/add`

Authenticated. Adds a book to the user's library.

**Body:** `{ googleBooksId: string }`

**Behavior:**
1. Verify Supabase auth
2. Check `profiles.freemium_book_count` vs `freemium_book_limit` — return `403` with upgrade message if at limit
3. Upsert `books` row (insert if not exists, reuse if exists by `google_books_id`)
4. Insert `user_books` row (or return existing)
5. Insert `user_progress` row with `current_phase: 'orient'` (or return existing)

**Response:** `{ bookId: string, userBookId: string }`

---

## POST `/api/chat/[bookId]/[phase]`

Authenticated. Main AI streaming endpoint. Behavior differs by phase.

**All phases:**
- Verify Supabase auth
- Verify user has a `user_progress` row for this book

### Phase: `orient`
- If `books.summary` and `books.big_ideas` are populated: return cached data (no AI call)
- Else: stream AI generation using the Orient prompt
- On stream completion:
  - Save `summary` and `big_ideas` to `books` row
  - Create `concept_nodes` from each big idea
  - Set `user_progress.orient_completed_at`
  - Update `user_progress.current_phase` to `'reflect'`

### Phase: `reflect`
- **Body:** `{ messages: { role: string, content: string }[] }` (full conversation history)
- Streams next AI response using the Reflect prompt
- On completion signal (`done: true` in body):
  - Generate `insight_card_text` (2–3 sentence summary)
  - Save `reflect_messages` and `insight_card_text` to `user_progress`
  - Set `reflect_completed_at`, advance `current_phase` to `'connect'`

### Phase: `connect`
- Non-streaming — returns JSON
- Fetches user's existing `concept_nodes` across all books
- Calls AI with the Connect prompt
- Saves suggestions to `concept_edges` with `accepted: false`, `ai_suggested: true`
- **Response:** `{ suggestions: EdgeSuggestion[] }`

### Phase: `act`
- **Body:** `{ messages: { role: string, content: string }[] }`
- Streams goal-setting conversation using the Act prompt
- On goal confirmed (`goalConfirmed: true` in body):
  - Insert row into `user_goals`
  - Return updated goals list
- On act completion:
  - Set `act_completed_at`, update `user_books.status` to `'completed'`

---

## POST `/api/graph/suggest`

Authenticated. Returns AI-suggested edges for the Connect phase.

**Behavior:**
- Fetches user's concept nodes across all books
- Returns up to 5 suggestions
- Saves to `concept_edges` with `accepted: false`

**Response:** `{ suggestions: { sourceNodeId, targetNodeId, reason }[] }`

---

## POST `/api/rooms/create`

Authenticated.

**Body:** `{ name: string, description?: string }`

**Behavior:**
- Generates unique `invite_code`
- Inserts `reading_rooms` row
- Inserts `reading_room_members` row with `role: 'admin'`

**Response:** `{ roomId: string, inviteCode: string }`

---

## POST `/api/rooms/join`

Authenticated.

**Body:** `{ inviteCode: string }`

**Behavior:**
- Looks up room by `invite_code`
- Inserts `reading_room_members` row with `role: 'member'`

**Response:** `{ roomId: string }`

---

## POST `/api/rooms/share`

Authenticated. Explicit opt-in only — user must confirm before this commits.

**Body:** `{ bookId: string, roomId: string, insightCardText: string, edited: boolean }`

**Behavior:**
1. Verify user is a member of the room
2. Verify user has `user_progress` for the book with `reflect_completed_at` set
3. Insert `room_insight_shares` row (snapshot of text at share time)
4. Returns share preview for client-side confirmation display

**Response:** `{ shareId: string, preview: InsightCardSnapshot }`

---

## POST `/api/review/generate`

Authenticated. Runs as a Vercel background function (max duration: 60s).

**Body:** `{ year: number, month: number }`

**Behavior:**
1. Verify user auth
2. Check if `monthly_reviews` row already exists — return cached if so
3. Fetch all books completed/active in the given month, their reflections, goals
4. Generate: `headline`, `pattern_insight`, `carry_question` via AI
5. Generate unique `share_token`
6. Save to `monthly_reviews`

**Response:** `{ token: string }`

Public share page at `/review/[token]` — no auth required, reads single row by `share_token`.
