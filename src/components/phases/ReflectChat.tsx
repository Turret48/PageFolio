'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Msg = { role: 'user' | 'assistant'; content: string }
type Status = 'loading' | 'chatting' | 'finishing' | 'done'

interface Props {
  bookId: string
  title: string
  author: string
  coverUrl: string | null
  savedMessages: Msg[] | null
  savedInsightCard: string | null
  isCompleted: boolean
}

export default function ReflectChat({
  bookId, title, author, coverUrl, savedMessages, savedInsightCard, isCompleted,
}: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<Msg[]>(savedMessages ?? [])
  const [streaming, setStreaming] = useState('')
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<Status>(isCompleted ? 'done' : 'loading')
  const [insightCard, setInsightCard] = useState<string | null>(savedInsightCard)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const didFetch = useRef(false)

  const userCount = messages.filter((m) => m.role === 'user').length

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  useEffect(() => {
    if (isCompleted) return
    if (didFetch.current) return
    didFetch.current = true
    fetchAI([])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAI(msgs: Msg[]) {
    setError(null)
    setStreaming('')
    const res = await fetch(`/api/chat/${bookId}/reflect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgs }),
    })
    if (!res.ok || !res.body) { setError('Connection failed. Try again.'); setStatus('chatting'); return }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let content = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      content += decoder.decode(value, { stream: true })
      setStreaming(content)
    }
    setMessages((prev) => [...prev, { role: 'assistant', content }])
    setStreaming('')
    setStatus('chatting')
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || status !== 'chatting') return
    const next: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setStatus('loading')
    await fetchAI(next)
  }

  async function handleFinish() {
    setStatus('finishing')
    setError(null)
    const res = await fetch(`/api/chat/${bookId}/reflect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, done: true }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setStatus('chatting'); return }
    setInsightCard(data.insightCard)
    setStatus('done')
  }

  return (
    <div className="pb-40 md:pb-28">
      <div className="flex gap-3 px-4 pt-6 pb-4 border-b border-border">
        {coverUrl && <img src={coverUrl} alt={title} className="w-10 h-14 object-cover rounded flex-shrink-0" />}
        <div className="flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[0.09em] text-muted mb-0.5">Reflect</p>
          <p className="font-display text-base font-semibold text-ink leading-tight">{title}</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 max-w-2xl mx-auto">
        {messages.map((m, i) =>
          m.role === 'assistant'
            ? <AiBubble key={i} content={m.content} />
            : <UserBubble key={i} content={m.content} />,
        )}
        {streaming && <AiBubble content={streaming} isStreaming />}
        {status === 'loading' && !streaming && (
          <div className="flex items-center gap-2 py-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
            <span className="text-xs text-muted">Thinking…</span>
          </div>
        )}
        {status === 'done' && insightCard && (
          <div className="mt-4 p-4 rounded-card border border-cayenne/20 bg-cayenne/5">
            <p className="text-[10px] uppercase tracking-[0.09em] text-cayenne mb-2">Your Insight</p>
            <p className="text-sm text-ink leading-relaxed">{insightCard}</p>
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-16 md:bottom-0 left-0 md:left-56 right-0 bg-surface/95 backdrop-blur-sm border-t border-border px-4 py-3 z-40 space-y-2">
        {status === 'done' ? (
          <button
            onClick={() => router.push(`/book/${bookId}/connect`)}
            className="w-full bg-cayenne text-white text-sm font-medium py-3 rounded-pill hover:bg-cayenne/90 transition-colors"
          >
            Continue to Connect →
          </button>
        ) : (
          <>
            {userCount >= 3 && status === 'chatting' && (
              <button
                onClick={handleFinish}
                className="w-full text-sm text-cayenne font-medium py-2 rounded-pill border border-cayenne/30 hover:bg-cayenne/5 transition-colors"
              >
                Wrap up &amp; get my insight →
              </button>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={status === 'loading' || status === 'finishing' ? 'Thinking…' : 'Your response…'}
                disabled={status !== 'chatting'}
                className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-ink text-sm focus:outline-none focus:ring-2 focus:ring-cayenne/20 focus:border-cayenne disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={status !== 'chatting' || !input.trim()}
                className="px-4 py-2.5 bg-cayenne text-white text-sm font-medium rounded-lg hover:bg-cayenne/90 transition-colors disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

function AiBubble({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  return (
    <div className="max-w-[85%]">
      <p className={`text-sm text-ink leading-relaxed bg-surface border border-border rounded-card rounded-tl-sm px-3 py-2.5${isStreaming ? ' opacity-80' : ''}`}>
        {renderInlineMarkdown(content)}
      </p>
    </div>
  )
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] text-sm text-white leading-relaxed bg-cayenne rounded-card rounded-tr-sm px-3 py-2.5">
        {content}
      </p>
    </div>
  )
}
