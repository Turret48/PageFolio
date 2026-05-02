import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { books, userBooks, userProgress } from '@/lib/db/schema'
import OrientView from '@/components/phases/OrientView'

export default async function OrientPage({ params }: { params: { bookId: string } }) {
  const { bookId } = params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [userBook] = await db.select({ id: userBooks.id }).from(userBooks)
    .where(and(eq(userBooks.user_id, user.id), eq(userBooks.book_id, bookId)))
  if (!userBook) redirect('/library')

  const [book] = await db.select({
    title: books.title,
    author: books.author,
    coverUrl: books.cover_url,
  }).from(books).where(eq(books.id, bookId))
  if (!book) redirect('/library')

  const [progress] = await db.select({
    orientCompletedAt: userProgress.orient_completed_at,
  }).from(userProgress)
    .where(and(eq(userProgress.user_id, user.id), eq(userProgress.book_id, bookId)))

  return (
    <OrientView
      bookId={bookId}
      title={book.title}
      author={book.author}
      coverUrl={book.coverUrl}
      isCompleted={!!progress?.orientCompletedAt}
    />
  )
}
