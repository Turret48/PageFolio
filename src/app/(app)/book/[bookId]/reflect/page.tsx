import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { books, userBooks, userProgress } from '@/lib/db/schema'
import ReflectChat from '@/components/phases/ReflectChat'

type Msg = { role: 'user' | 'assistant'; content: string }

export default async function ReflectPage({ params }: { params: { bookId: string } }) {
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
      reflectCompletedAt: userProgress.reflect_completed_at,
      reflectMessages: userProgress.reflect_messages,
      insightCardText: userProgress.insight_card_text,
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
  if (!row.orientCompletedAt) redirect(`/book/${bookId}/orient`)

  return (
    <ReflectChat
      bookId={bookId}
      title={row.title}
      author={row.author}
      coverUrl={row.coverUrl}
      savedMessages={(row.reflectMessages as Msg[] | null) ?? null}
      savedInsightCard={row.insightCardText ?? null}
      isCompleted={!!row.reflectCompletedAt}
    />
  )
}
