import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { userBooks, books, userProgress } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import CurrentlyReadingCard from '@/components/library/CurrentlyReadingCard'
import BookGrid from '@/components/library/BookGrid'
import Link from 'next/link'

type Phase = 'orient' | 'reflect' | 'connect' | 'act'

function getCompletedPhases(progress: {
  orient_completed_at: Date | null
  reflect_completed_at: Date | null
  connect_completed_at: Date | null
  act_completed_at: Date | null
}): Phase[] {
  const phases: Phase[] = []
  if (progress.orient_completed_at) phases.push('orient')
  if (progress.reflect_completed_at) phases.push('reflect')
  if (progress.connect_completed_at) phases.push('connect')
  if (progress.act_completed_at) phases.push('act')
  return phases
}

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const library = await db
    .select({
      userBookId: userBooks.id,
      bookId: books.id,
      title: books.title,
      author: books.author,
      coverUrl: books.cover_url,
      status: userBooks.status,
      currentPhase: userProgress.current_phase,
      orientCompletedAt: userProgress.orient_completed_at,
      reflectCompletedAt: userProgress.reflect_completed_at,
      connectCompletedAt: userProgress.connect_completed_at,
      actCompletedAt: userProgress.act_completed_at,
    })
    .from(userBooks)
    .innerJoin(books, eq(userBooks.book_id, books.id))
    .leftJoin(userProgress, and(
      eq(userProgress.user_id, userBooks.user_id),
      eq(userProgress.book_id, userBooks.book_id),
    ))
    .where(eq(userBooks.user_id, user.id))

  const active = library.filter((b) => b.status === 'active')
  const currentBook = active[0] ?? null

  const gridBooks = library
    .filter((b) => !currentBook || b.bookId !== currentBook.bookId)
    .map((b) => ({
      bookId: b.bookId,
      title: b.title,
      author: b.author,
      coverUrl: b.coverUrl,
      currentPhase: (b.currentPhase ?? 'orient') as Phase,
      completedPhases: b.orientCompletedAt !== undefined ? getCompletedPhases({
        orient_completed_at: b.orientCompletedAt,
        reflect_completed_at: b.reflectCompletedAt,
        connect_completed_at: b.connectCompletedAt,
        act_completed_at: b.actCompletedAt,
      }) : [],
    }))

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto md:max-w-none md:px-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-semibold text-ink">Your Library</h1>
        <Link
          href="/library/add"
          className="bg-cayenne text-white text-sm font-medium px-4 py-2 rounded-pill hover:bg-cayenne/90 transition-colors"
        >
          + Add Book
        </Link>
      </div>

      {currentBook && (
        <div className="mb-6">
          <CurrentlyReadingCard
            bookId={currentBook.bookId}
            title={currentBook.title}
            author={currentBook.author}
            coverUrl={currentBook.coverUrl}
            currentPhase={(currentBook.currentPhase ?? 'orient') as Phase}
            completedPhases={getCompletedPhases({
              orient_completed_at: currentBook.orientCompletedAt,
              reflect_completed_at: currentBook.reflectCompletedAt,
              connect_completed_at: currentBook.connectCompletedAt,
              act_completed_at: currentBook.actCompletedAt,
            })}
          />
        </div>
      )}

      {gridBooks.length > 0 && (
        <>
          <p className="text-[10px] uppercase tracking-[0.09em] text-muted mb-3">All Books</p>
          <BookGrid books={gridBooks} />
        </>
      )}

      {library.length === 0 && (
        <div className="text-center py-16">
          <p className="font-display text-lg text-ink mb-1">Start your first book</p>
          <p className="text-muted text-sm mb-6">Search for any nonfiction book to get started.</p>
          <Link
            href="/library/add"
            className="inline-block bg-cayenne text-white text-sm font-medium px-6 py-2.5 rounded-pill hover:bg-cayenne/90 transition-colors"
          >
            Add a Book
          </Link>
        </div>
      )}
    </div>
  )
}
