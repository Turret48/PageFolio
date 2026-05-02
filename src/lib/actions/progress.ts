'use server'

import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { userProgress } from '@/lib/db/schema'

export async function markOrientComplete(bookId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const [progress] = await db.select().from(userProgress)
    .where(and(eq(userProgress.user_id, user.id), eq(userProgress.book_id, bookId)))
  if (!progress) throw new Error('Progress row not found')
  if (progress.orient_completed_at) return

  await db.update(userProgress)
    .set({
      orient_completed_at: new Date(),
      current_phase: 'reflect',
      updated_at: new Date(),
    })
    .where(and(
      eq(userProgress.user_id, user.id),
      eq(userProgress.book_id, bookId),
    ))
}
