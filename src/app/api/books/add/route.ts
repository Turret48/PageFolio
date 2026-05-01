import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { books, userBooks, userProgress, profiles } from '@/lib/db/schema'
import { getBookById } from '@/lib/books/googleBooks'

const bodySchema = z.object({ googleBooksId: z.string().min(1) })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { googleBooksId } = parsed.data

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id))
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  if (profile.freemium_book_count >= profile.freemium_book_limit) {
    return NextResponse.json(
      { error: `You've reached your ${profile.freemium_book_limit}-book limit on the free plan.` },
      { status: 403 },
    )
  }

  // Reuse existing book row or create it
  let [book] = await db.select().from(books).where(eq(books.google_books_id, googleBooksId))

  if (!book) {
    const candidate = await getBookById(googleBooksId)
    if (!candidate) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

    ;[book] = await db.insert(books).values({
      google_books_id: googleBooksId,
      title: candidate.title,
      author: candidate.author,
      cover_url: candidate.coverUrl,
      description: candidate.description,
      published_year: candidate.publishedYear,
      page_count: candidate.pageCount,
      categories: candidate.categories,
    }).returning()
  }

  // Return early if already in library
  const [existing] = await db.select().from(userBooks)
    .where(and(eq(userBooks.user_id, user.id), eq(userBooks.book_id, book.id)))
  if (existing) return NextResponse.json({ bookId: book.id, userBookId: existing.id })

  const [userBook] = await db.insert(userBooks)
    .values({ user_id: user.id, book_id: book.id })
    .returning()

  await db.insert(userProgress)
    .values({ user_id: user.id, book_id: book.id })
    .onConflictDoNothing()

  await db.update(profiles)
    .set({ freemium_book_count: profile.freemium_book_count + 1 })
    .where(eq(profiles.id, user.id))

  return NextResponse.json({ bookId: book.id, userBookId: userBook.id })
}
