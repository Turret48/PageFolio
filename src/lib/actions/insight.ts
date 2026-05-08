'use server'

import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { userProgress } from '@/lib/db/schema'

export async function saveInsightCard(bookId: string, text: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await db.update(userProgress)
    .set({ insight_card_text: text, updated_at: new Date() })
    .where(and(eq(userProgress.user_id, user.id), eq(userProgress.book_id, bookId)))
}
