import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { books, userBooks, userProgress, conceptNodes } from '@/lib/db/schema'
import { generateObject, generateText, streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

const anthropic = createAnthropic({
  apiKey: process.env.PAGEFOLIO_AI_KEY!,
  baseURL: 'https://api.anthropic.com/v1',
})
import { orientPrompt, reflectPrompt, insightCardPrompt } from '@/lib/ai/prompts'

type BigIdea = { label: string; description: string; theme: 'mindset' | 'systems' | 'relationships' | 'performance' | 'creativity' }
type Msg = { role: 'user' | 'assistant'; content: string }

const orientSchema = z.object({
  summary: z.string().min(1),
  bigIdeas: z.array(z.object({
    label: z.string().min(1),
    description: z.string().min(1),
    theme: z.enum(['mindset', 'systems', 'relationships', 'performance', 'creativity']),
  })).min(3).max(4),
})

const reflectBodySchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })),
  done: z.boolean().optional().default(false),
})

export async function POST(
  request: NextRequest,
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
    if (phase === 'reflect') return await handleReflect(request, bookId, user.id)
    return NextResponse.json({ error: 'Phase not yet implemented' }, { status: 501 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[chat API]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

async function handleOrient(bookId: string, userId: string): Promise<NextResponse> {
  const [book] = await db.select().from(books).where(eq(books.id, bookId))
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  const cachedIdeas = book.big_ideas as BigIdea[] | null
  const cacheValid = book.summary && cachedIdeas?.length && cachedIdeas[0]?.description
  if (cacheValid) {
    await ensureConceptNodes(userId, bookId, cachedIdeas!)
    return NextResponse.json({ summary: book.summary, bigIdeas: cachedIdeas })
  }

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-6'),
    schema: orientSchema,
    prompt: orientPrompt(book.title, book.author),
  })

  await db.update(books)
    .set({ summary: object.summary, big_ideas: object.bigIdeas })
    .where(eq(books.id, bookId))
  await ensureConceptNodes(userId, bookId, object.bigIdeas)

  return NextResponse.json({ summary: object.summary, bigIdeas: object.bigIdeas })
}

async function handleReflect(request: NextRequest, bookId: string, userId: string): Promise<Response> {
  const parsed = reflectBodySchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const { messages, done } = parsed.data

  const [book] = await db.select({ title: books.title, author: books.author })
    .from(books).where(eq(books.id, bookId))
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  if (done) {
    const conversationText = messages.map((m) => `${m.role}: ${m.content}`).join('\n\n')
    const { text: insightCard } = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      prompt: insightCardPrompt(book.title, conversationText),
    })
    await db.update(userProgress)
      .set({
        reflect_messages: messages,
        insight_card_text: insightCard,
        reflect_completed_at: new Date(),
        current_phase: 'connect',
        updated_at: new Date(),
      })
      .where(and(eq(userProgress.user_id, userId), eq(userProgress.book_id, bookId)))
    return NextResponse.json({ insightCard })
  }

  const seedMessages: Msg[] = messages.length > 0
    ? messages as Msg[]
    : [{ role: 'user', content: 'Ready to reflect.' }]

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: reflectPrompt(book.title, book.author),
    messages: seedMessages,
  })
  return result.toTextStreamResponse()
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
