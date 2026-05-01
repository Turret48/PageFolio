CREATE TYPE "public"."book_status" AS ENUM('active', 'completed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('pending', 'done', 'partial', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."node_theme" AS ENUM('mindset', 'systems', 'relationships', 'performance', 'creativity');--> statement-breakpoint
CREATE TYPE "public"."phase" AS ENUM('orient', 'reflect', 'connect', 'act');--> statement-breakpoint
CREATE TYPE "public"."room_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."user_tag" AS ENUM('actively_using', 'want_to_revisit', 'skeptical');--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_books_id" text NOT NULL,
	"open_library_id" text,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"cover_url" text,
	"description" text,
	"published_year" integer,
	"page_count" integer,
	"categories" text[] DEFAULT '{}' NOT NULL,
	"summary" text,
	"big_ideas" jsonb,
	"is_nonfiction" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "books_google_books_id_unique" UNIQUE("google_books_id")
);
--> statement-breakpoint
CREATE TABLE "concept_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_node_id" uuid NOT NULL,
	"target_node_id" uuid NOT NULL,
	"ai_suggested" boolean DEFAULT true NOT NULL,
	"accepted" boolean DEFAULT false NOT NULL,
	"user_created" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "concept_edges_user_id_source_node_id_target_node_id_unique" UNIQUE("user_id","source_node_id","target_node_id")
);
--> statement-breakpoint
CREATE TABLE "concept_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"book_id" uuid,
	"label" text NOT NULL,
	"original_label" text NOT NULL,
	"theme" "node_theme" NOT NULL,
	"user_tag" "user_tag",
	"is_merged" boolean DEFAULT false NOT NULL,
	"merged_into_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"headline" text NOT NULL,
	"pattern_insight" text NOT NULL,
	"carry_question" text NOT NULL,
	"books_data" jsonb NOT NULL,
	"big_ideas_data" jsonb NOT NULL,
	"goals_data" jsonb NOT NULL,
	"share_token" text NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_reviews_share_token_unique" UNIQUE("share_token"),
	CONSTRAINT "monthly_reviews_user_id_year_month_unique" UNIQUE("user_id","year","month")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"freemium_book_count" integer DEFAULT 0 NOT NULL,
	"freemium_book_limit" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_room_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"proposed_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reading_room_books_room_id_book_id_unique" UNIQUE("room_id","book_id")
);
--> statement-breakpoint
CREATE TABLE "reading_room_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "room_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reading_room_members_room_id_user_id_unique" UNIQUE("room_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "reading_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" uuid NOT NULL,
	"invite_code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reading_rooms_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "room_goal_witnesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"witnessed_by" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "room_goal_witnesses_goal_id_witnessed_by_unique" UNIQUE("goal_id","witnessed_by")
);
--> statement-breakpoint
CREATE TABLE "room_insight_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"insight_card_text" text NOT NULL,
	"shared_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "room_insight_shares_user_id_book_id_room_id_unique" UNIQUE("user_id","book_id","room_id")
);
--> statement-breakpoint
CREATE TABLE "user_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"status" "book_status" DEFAULT 'active' NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "user_books_user_id_book_id_unique" UNIQUE("user_id","book_id")
);
--> statement-breakpoint
CREATE TABLE "user_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"goal_text" text NOT NULL,
	"target_date" date,
	"status" "goal_status" DEFAULT 'pending' NOT NULL,
	"nudge_shown" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"current_phase" "phase" DEFAULT 'orient' NOT NULL,
	"orient_completed_at" timestamp,
	"reflect_completed_at" timestamp,
	"connect_completed_at" timestamp,
	"act_completed_at" timestamp,
	"reflect_messages" jsonb,
	"insight_card_text" text,
	"insight_card_edited" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_progress_user_id_book_id_unique" UNIQUE("user_id","book_id")
);
--> statement-breakpoint
ALTER TABLE "concept_edges" ADD CONSTRAINT "concept_edges_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_edges" ADD CONSTRAINT "concept_edges_source_node_id_concept_nodes_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "public"."concept_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_edges" ADD CONSTRAINT "concept_edges_target_node_id_concept_nodes_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "public"."concept_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_nodes" ADD CONSTRAINT "concept_nodes_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_nodes" ADD CONSTRAINT "concept_nodes_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_reviews" ADD CONSTRAINT "monthly_reviews_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_room_books" ADD CONSTRAINT "reading_room_books_room_id_reading_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."reading_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_room_books" ADD CONSTRAINT "reading_room_books_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_room_books" ADD CONSTRAINT "reading_room_books_proposed_by_profiles_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_room_members" ADD CONSTRAINT "reading_room_members_room_id_reading_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."reading_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_room_members" ADD CONSTRAINT "reading_room_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_rooms" ADD CONSTRAINT "reading_rooms_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_goal_witnesses" ADD CONSTRAINT "room_goal_witnesses_goal_id_user_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."user_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_goal_witnesses" ADD CONSTRAINT "room_goal_witnesses_witnessed_by_profiles_id_fk" FOREIGN KEY ("witnessed_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_goal_witnesses" ADD CONSTRAINT "room_goal_witnesses_room_id_reading_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."reading_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_insight_shares" ADD CONSTRAINT "room_insight_shares_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_insight_shares" ADD CONSTRAINT "room_insight_shares_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_insight_shares" ADD CONSTRAINT "room_insight_shares_room_id_reading_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."reading_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;