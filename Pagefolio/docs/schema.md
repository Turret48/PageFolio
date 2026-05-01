# Pagefolio — Database Schema Reference

Stack: Supabase (PostgreSQL) + Drizzle ORM. All tables have RLS enabled.

---

## Table Definitions

### `profiles`
Extends `auth.users`. Auto-created on signup via Supabase trigger.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | References `auth.users` |
| display_name | text | |
| avatar_url | text | nullable |
| freemium_book_count | integer | default 0 |
| freemium_book_limit | integer | default 5 |
| created_at | timestamp | |

---

### `books`
Shared across all users. One row per unique book, deduped by `google_books_id`.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| google_books_id | text UNIQUE | |
| open_library_id | text | nullable |
| title | text | |
| author | text | |
| cover_url | text | nullable |
| description | text | nullable |
| published_year | integer | nullable |
| page_count | integer | nullable |
| categories | text[] | from Google Books |
| summary | text | nullable — AI generated, cached & shared across users |
| big_ideas | jsonb | nullable — array of `{label, theme}`, AI generated, cached & shared |
| is_nonfiction | boolean | default true |
| created_at | timestamp | |

**Note:** `summary` and `big_ideas` are generated once and cached at the book level — they are shared across all users who add the same book.

---

### `user_books`
Join table — maps users to their library.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | References `profiles.id` |
| book_id | uuid | References `books.id` |
| status | enum | `'active' \| 'completed' \| 'paused'`, default `'active'` |
| added_at | timestamp | |
| completed_at | timestamp | nullable |

Unique constraint: `(user_id, book_id)`

---

### `user_progress`
One row per user per book. Tracks phase completion and stores phase content.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | References `profiles.id` |
| book_id | uuid | References `books.id` |
| current_phase | enum | `'orient' \| 'reflect' \| 'connect' \| 'act'`, default `'orient'` |
| orient_completed_at | timestamp | nullable |
| reflect_completed_at | timestamp | nullable |
| connect_completed_at | timestamp | nullable |
| act_completed_at | timestamp | nullable |
| reflect_messages | jsonb | nullable — array of `{role, content}` conversation turns |
| insight_card_text | text | nullable — AI-curated 2–3 sentence summary from Reflect |
| insight_card_edited | boolean | default false — true if user modified AI text |
| updated_at | timestamp | |

Unique constraint: `(user_id, book_id)`

---

### `user_goals`
Goals created in the Act phase. Up to 3 per book per user.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | References `profiles.id` |
| book_id | uuid | References `books.id` |
| goal_text | text | |
| target_date | date | nullable |
| status | enum | `'pending' \| 'done' \| 'partial' \| 'skipped'`, default `'pending'` |
| nudge_shown | boolean | default false |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### `concept_nodes`
Personal knowledge graph nodes. Created from `big_ideas` on Orient completion, plus any user-created nodes.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | References `profiles.id` |
| book_id | uuid | References `books.id`, nullable (null = user-created standalone) |
| label | text | Current label — user can rename |
| original_label | text | AI-generated label, preserved for reference |
| theme | enum | `'mindset' \| 'systems' \| 'relationships' \| 'performance' \| 'creativity'` |
| user_tag | enum | `'actively_using' \| 'want_to_revisit' \| 'skeptical'`, nullable |
| is_merged | boolean | default false |
| merged_into_id | uuid | nullable — references `concept_nodes.id` |
| created_at | timestamp | |

---

### `concept_edges`
Connections between concept nodes.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | References `profiles.id` |
| source_node_id | uuid | References `concept_nodes.id` |
| target_node_id | uuid | References `concept_nodes.id` |
| ai_suggested | boolean | default true |
| accepted | boolean | default false |
| user_created | boolean | default false |
| created_at | timestamp | |

Unique constraint: `(user_id, source_node_id, target_node_id)`

---

### `reading_rooms`
Book clubs / reading groups.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| description | text | nullable |
| created_by | uuid | References `profiles.id` |
| invite_code | text UNIQUE | Generated on creation |
| created_at | timestamp | |

---

### `reading_room_members`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| room_id | uuid | References `reading_rooms.id` |
| user_id | uuid | References `profiles.id` |
| role | enum | `'admin' \| 'member'`, default `'member'` |
| joined_at | timestamp | |

Unique constraint: `(room_id, user_id)`

---

### `reading_room_books`
Books proposed/shared within a reading room.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| room_id | uuid | References `reading_rooms.id` |
| book_id | uuid | References `books.id` |
| proposed_by | uuid | References `profiles.id` |
| created_at | timestamp | |

Unique constraint: `(room_id, book_id)`

---

### `room_insight_shares`
Tracks which insight cards a user has shared to which rooms. **Explicit opt-in only — nothing is shared automatically.**

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | References `profiles.id` |
| book_id | uuid | References `books.id` |
| room_id | uuid | References `reading_rooms.id` |
| insight_card_text | text | Snapshot at time of sharing — may differ from current |
| shared_at | timestamp | |

Unique constraint: `(user_id, book_id, room_id)`

---

### `room_goal_witnesses`
Tracks "I see your commitment" acknowledgments on goals.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| goal_id | uuid | References `user_goals.id` |
| witnessed_by | uuid | References `profiles.id` |
| room_id | uuid | References `reading_rooms.id` |
| created_at | timestamp | |

Unique constraint: `(goal_id, witnessed_by)`

---

### `monthly_reviews`
Cached monthly review data per user per month.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | References `profiles.id` |
| year | integer | |
| month | integer | 1–12 |
| headline | text | AI generated |
| pattern_insight | text | AI generated cross-book theme |
| carry_question | text | AI generated open question |
| books_data | jsonb | Snapshot of books/progress for the month |
| big_ideas_data | jsonb | Top concepts for the month |
| goals_data | jsonb | Goals set and status snapshot |
| share_token | text UNIQUE | For public share link |
| generated_at | timestamp | |

Unique constraint: `(user_id, year, month)`

---

## Row Level Security (RLS)

RLS is enabled on **all tables**.

| Table | Policy |
|---|---|
| `profiles` | Users can read/update their own row only |
| `books` | All authenticated users can read; authenticated users can insert |
| `user_books` | Users can CRUD their own rows only |
| `user_progress` | Users can CRUD their own rows only |
| `user_goals` | Users can CRUD their own rows only |
| `concept_nodes` | Users can CRUD their own rows only |
| `concept_edges` | Users can CRUD their own rows only |
| `reading_rooms` | Readable by members of the room only |
| `reading_room_members` | Readable by members of the same room |
| `reading_room_books` | Readable by members of the same room |
| `room_insight_shares` | Readable by members of the shared room |
| `room_goal_witnesses` | Readable by members of the relevant room |
| `monthly_reviews` | Owner can read/write own rows; `share_token` allows public read of a single row |

---

## Auth Setup

- **Provider**: Email + password (magic link optional)
- **On signup**: Supabase trigger auto-inserts a row into `profiles`
- **Post-login redirect**: `/library`
- **Freemium limit**: `profiles.freemium_book_limit` (default 5); enforce in application logic before inserting into `user_books`
