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

  const [row] = await db
    .select({
      title: books.title,
      author: books.author,
      coverUrl: books.cover_url,
      orientCompletedAt: userProgress.orient_completed_at,
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

  return (
    <OrientView
      bookId={bookId}
      title={row.title}
      author={row.author}
      coverUrl={row.coverUrl}
      isCompleted={!!row.orientCompletedAt}
    />
  )
}
