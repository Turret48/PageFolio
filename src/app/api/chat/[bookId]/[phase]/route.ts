import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { books, userBooks, conceptNodes } from '@/lib/db/schema'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { orientPrompt } from '@/lib/ai/prompts'

type BigIdea = { label: string; theme: 'mindset' | 'systems' | 'relationships' | 'performance' | 'creativity' }

const orientSchema = z.object({
  summary: z.string().min(1),
  bigIdeas: z.array(z.object({
    label: z.string().min(1),
    theme: z.enum(['mindset', 'systems', 'relationships', 'performance', 'creativity']),
  })).min(1),
})

export async function POST(
  _request: NextRequest,
  { params }: { params: { bookId: string; phase: string } },
) {
  const { bookId, phase } = params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [userBook] = await db.select({ id: userBooks.id }).from(userBooks)
    .where(and(eq(userBooks.user_id, user.id), eq(userBooks.book_id, bookId)))
  if (!userBook) return NextResponse.json({ error: 'Book not in library' }, { status: 404 })

  try {
    if (phase === 'orient') return await handleOrient(bookId, user.id)
    return NextResponse.json({ error: 'Phase not yet implemented' }, { status: 501 })
  } catch (err) {
    console.error('[chat API]', err)
    return NextResponse.json({ error: 'Something went wrong generating content.' }, { status: 500 })
  }
}

async function handleOrient(bookId: string, userId: string): Promise<NextResponse> {
  const [book] = await db.select().from(books).where(eq(books.id, bookId))
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  if (book.summary && book.big_ideas) {
    await ensureConceptNodes(userId, bookId, book.big_ideas as BigIdea[])
    return NextResponse.json({ summary: book.summary, bigIdeas: book.big_ideas })
  }

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: orientSchema,
    prompt: orientPrompt(book.title, book.author),
  })

  await db.update(books)
    .set({ summary: object.summary, big_ideas: object.bigIdeas })
    .where(eq(books.id, bookId))

  await ensureConceptNodes(userId, bookId, object.bigIdeas)

  return NextResponse.json({ summary: object.summary, bigIdeas: object.bigIdeas })
}

async function ensureConceptNodes(userId: string, bookId: string, bigIdeas: BigIdea[]) {
  const existing = await db.select({ id: conceptNodes.id }).from(conceptNodes)
    .where(and(eq(conceptNodes.user_id, userId), eq(conceptNodes.book_id, bookId)))
  if (existing.length > 0) return

  await db.insert(conceptNodes).values(
    bigIdeas.map((idea) => ({
      user_id: userId,
      book_id: bookId,
      label: idea.label,
      original_label: idea.label,
      theme: idea.theme,
    })),
  )
}
