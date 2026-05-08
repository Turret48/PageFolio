import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { books, userBooks, userProgress } from '@/lib/db/schema'
import BookDetail from '@/components/library/BookDetail'

type Phase = 'orient' | 'reflect' | 'connect' | 'act'

export default async function BookPage({ params }: { params: { bookId: string } }) {
  const { bookId } = params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [row] = await db
    .select({
      title: books.title,
      author: books.author,
      coverUrl: books.cover_url,
      summary: books.summary,
      currentPhase: userProgress.current_phase,
      orientDone: userProgress.orient_completed_at,
      reflectDone: userProgress.reflect_completed_at,
      connectDone: userProgress.connect_completed_at,
      actDone: userProgress.act_completed_at,
    })
    .from(books)
    .innerJoin(userBooks, and(
      eq(userBooks.book_id, books.id),
      eq(userBooks.user_id, user.id),
    ))
    .leftJoin(userProgress, and(
      eq(userProgress.book_id, books.id),
      eq(userProgress.user_id, user.id),
    ))
    .where(eq(books.id, bookId))

  if (!row) redirect('/library')

  const completedPhases: Phase[] = [
    ...(row.orientDone ? ['orient' as Phase] : []),
    ...(row.reflectDone ? ['reflect' as Phase] : []),
    ...(row.connectDone ? ['connect' as Phase] : []),
    ...(row.actDone ? ['act' as Phase] : []),
  ]

  return (
    <BookDetail
      bookId={bookId}
      title={row.title}
      author={row.author}
      coverUrl={row.coverUrl}
      summary={row.summary}
      currentPhase={(row.currentPhase as Phase) ?? 'orient'}
      completedPhases={completedPhases}
    />
  )
}
