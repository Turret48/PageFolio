import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  unique,
} from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const bookStatusEnum = pgEnum('book_status', ['active', 'completed', 'paused'])
export const phaseEnum = pgEnum('phase', ['orient', 'reflect', 'connect', 'act'])
export const goalStatusEnum = pgEnum('goal_status', ['pending', 'done', 'partial', 'skipped'])
export const nodeThemeEnum = pgEnum('node_theme', ['mindset', 'systems', 'relationships', 'performance', 'creativity'])
export const userTagEnum = pgEnum('user_tag', ['actively_using', 'want_to_revisit', 'skeptical'])
export const roomRoleEnum = pgEnum('room_role', ['admin', 'member'])

// ─── Tables ───────────────────────────────────────────────────────────────────

// Extends auth.users — row auto-created on signup via Supabase trigger
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // references auth.users(id) — enforced by DB trigger
  display_name: text('display_name').notNull(),
  avatar_url: text('avatar_url'),
  freemium_book_count: integer('freemium_book_count').default(0).notNull(),
  freemium_book_limit: integer('freemium_book_limit').default(5).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

// Shared across all users — one row per unique book
export const books = pgTable('books', {
  id: uuid('id').primaryKey().defaultRandom(),
  google_books_id: text('google_books_id').notNull().unique(),
  open_library_id: text('open_library_id'),
  title: text('title').notNull(),
  author: text('author').notNull(),
  cover_url: text('cover_url'),
  description: text('description'),
  published_year: integer('published_year'),
  page_count: integer('page_count'),
  categories: text('categories').array().notNull().default([]),
  summary: text('summary'),         // AI generated, cached & shared
  big_ideas: jsonb('big_ideas'),    // [{label, theme}][], AI generated, cached & shared
  is_nonfiction: boolean('is_nonfiction').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const userBooks = pgTable('user_books', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  book_id: uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  status: bookStatusEnum('status').default('active').notNull(),
  added_at: timestamp('added_at').defaultNow().notNull(),
  completed_at: timestamp('completed_at'),
}, (t) => [unique().on(t.user_id, t.book_id)])

export const userProgress = pgTable('user_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  book_id: uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  current_phase: phaseEnum('current_phase').default('orient').notNull(),
  orient_completed_at: timestamp('orient_completed_at'),
  reflect_completed_at: timestamp('reflect_completed_at'),
  connect_completed_at: timestamp('connect_completed_at'),
  act_completed_at: timestamp('act_completed_at'),
  reflect_messages: jsonb('reflect_messages'), // [{role, content}][]
  insight_card_text: text('insight_card_text'),
  insight_card_edited: boolean('insight_card_edited').default(false).notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [unique().on(t.user_id, t.book_id)])

export const userGoals = pgTable('user_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  book_id: uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  goal_text: text('goal_text').notNull(),
  target_date: date('target_date'),
  status: goalStatusEnum('status').default('pending').notNull(),
  nudge_shown: boolean('nudge_shown').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
})

export const conceptNodes = pgTable('concept_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  book_id: uuid('book_id').references(() => books.id, { onDelete: 'set null' }), // nullable = standalone node
  label: text('label').notNull(),
  original_label: text('original_label').notNull(),
  theme: nodeThemeEnum('theme').notNull(),
  user_tag: userTagEnum('user_tag'),
  is_merged: boolean('is_merged').default(false).notNull(),
  merged_into_id: uuid('merged_into_id'), // self-referential — set after table defined
  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const conceptEdges = pgTable('concept_edges', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  source_node_id: uuid('source_node_id').notNull().references(() => conceptNodes.id, { onDelete: 'cascade' }),
  target_node_id: uuid('target_node_id').notNull().references(() => conceptNodes.id, { onDelete: 'cascade' }),
  ai_suggested: boolean('ai_suggested').default(true).notNull(),
  accepted: boolean('accepted').default(false).notNull(),
  user_created: boolean('user_created').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (t) => [unique().on(t.user_id, t.source_node_id, t.target_node_id)])

export const readingRooms = pgTable('reading_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  created_by: uuid('created_by').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  invite_code: text('invite_code').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const readingRoomMembers = pgTable('reading_room_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  room_id: uuid('room_id').notNull().references(() => readingRooms.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  role: roomRoleEnum('role').default('member').notNull(),
  joined_at: timestamp('joined_at').defaultNow().notNull(),
}, (t) => [unique().on(t.room_id, t.user_id)])

export const readingRoomBooks = pgTable('reading_room_books', {
  id: uuid('id').primaryKey().defaultRandom(),
  room_id: uuid('room_id').notNull().references(() => readingRooms.id, { onDelete: 'cascade' }),
  book_id: uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  proposed_by: uuid('proposed_by').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (t) => [unique().on(t.room_id, t.book_id)])

export const roomInsightShares = pgTable('room_insight_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  book_id: uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  room_id: uuid('room_id').notNull().references(() => readingRooms.id, { onDelete: 'cascade' }),
  insight_card_text: text('insight_card_text').notNull(), // snapshot at share time
  shared_at: timestamp('shared_at').defaultNow().notNull(),
}, (t) => [unique().on(t.user_id, t.book_id, t.room_id)])

export const roomGoalWitnesses = pgTable('room_goal_witnesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  goal_id: uuid('goal_id').notNull().references(() => userGoals.id, { onDelete: 'cascade' }),
  witnessed_by: uuid('witnessed_by').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  room_id: uuid('room_id').notNull().references(() => readingRooms.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (t) => [unique().on(t.goal_id, t.witnessed_by)])

export const monthlyReviews = pgTable('monthly_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  headline: text('headline').notNull(),
  pattern_insight: text('pattern_insight').notNull(),
  carry_question: text('carry_question').notNull(),
  books_data: jsonb('books_data').notNull(),
  big_ideas_data: jsonb('big_ideas_data').notNull(),
  goals_data: jsonb('goals_data').notNull(),
  share_token: text('share_token').notNull().unique(),
  generated_at: timestamp('generated_at').defaultNow().notNull(),
}, (t) => [unique().on(t.user_id, t.year, t.month)])
