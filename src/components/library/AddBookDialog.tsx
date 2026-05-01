'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { BookCandidate } from '@/lib/books/googleBooks'

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function AddBookDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanMode, setScanMode] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    if (!debouncedQuery.trim() || scanMode) { setResults([]); return }
    setLoading(true)
    setError(null)
    fetch(`/api/books/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => setResults(data.books ?? []))
      .catch(() => setError('Search failed. Try again.'))
      .finally(() => setLoading(false))
  }, [debouncedQuery, scanMode])

  const startScanner = useCallback(async () => {
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      if (!videoRef.current) return
      await reader.decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current,
        (result) => {
          if (!result) return
          const isbn = result.getText()
          setScanMode(false)
          setQuery(isbn)
          setLoading(true)
          fetch(`/api/books/search?isbn=${encodeURIComponent(isbn)}`)
            .then((r) => r.json())
            .then((data) => setResults(data.books ?? []))
            .catch(() => setError('ISBN lookup failed.'))
            .finally(() => setLoading(false))
        },
      )
    } catch {
      setError('Camera access denied or not available.')
      setScanMode(false)
    }
  }, [])

  useEffect(() => {
    if (scanMode) startScanner()
  }, [scanMode, startScanner])

  function handleClose() {
    setOpen(false)
    setQuery('')
    setResults([])
    setError(null)
    setScanMode(false)
  }

  async function handleAdd(googleBooksId: string) {
    setAdding(googleBooksId)
    setError(null)
    try {
      const res = await fetch('/api/books/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleBooksId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to add book.'); return }
      handleClose()
      router.push(`/book/${data.bookId}/orient`)
      router.refresh()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setAdding(null)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-cayenne text-white text-sm font-medium px-4 py-2 rounded-pill hover:bg-cayenne/90 transition-colors"
      >
        + Add Book
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

          <div className="relative w-full md:max-w-lg bg-surface rounded-t-[24px] md:rounded-card md:mx-4 max-h-[85vh] flex flex-col pb-20 md:pb-0">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-display text-lg font-medium text-ink">Add a Book</h2>
              <button onClick={handleClose} className="text-muted hover:text-ink p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setScanMode(false) }}
                  placeholder="Search by title or author…"
                  className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-ink text-sm focus:outline-none focus:ring-2 focus:ring-cayenne/20 focus:border-cayenne"
                  autoFocus
                />
                <button
                  onClick={() => setScanMode((v) => !v)}
                  title="Scan ISBN barcode"
                  className={`px-3 py-2.5 rounded-lg border transition-colors ${scanMode ? 'bg-cayenne border-cayenne text-white' : 'border-border text-muted hover:text-ink'}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="7" y2="16"/><line x1="10" y1="8" x2="10" y2="16"/><line x1="13" y1="8" x2="13" y2="16"/><line x1="17" y1="8" x2="17" y2="16"/>
                  </svg>
                </button>
              </div>

              {scanMode && (
                <video ref={videoRef} className="w-full rounded-lg aspect-video bg-black object-cover" />
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
              {loading && <p className="text-sm text-muted text-center py-6">Searching…</p>}

              {!loading && results.length === 0 && debouncedQuery.trim() && !scanMode && (
                <p className="text-sm text-muted text-center py-6">No nonfiction books found.</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                {results.map((book) => (
                  <button
                    key={book.googleBooksId}
                    onClick={() => handleAdd(book.googleBooksId)}
                    disabled={adding === book.googleBooksId}
                    className="text-left bg-background rounded-card border border-border overflow-hidden hover:border-muted transition-colors disabled:opacity-50"
                  >
                    <div className="aspect-[2/3] bg-border/30">
                      {book.coverUrl
                        ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center p-2"><span className="font-display text-[10px] text-muted text-center leading-tight">{book.title}</span></div>
                      }
                    </div>
                    <div className="p-2">
                      <p className="font-display text-xs font-medium text-ink leading-tight line-clamp-2">{book.title}</p>
                      <p className="text-[10px] text-muted mt-0.5 truncate">{book.author}</p>
                      {adding === book.googleBooksId && (
                        <p className="text-[10px] text-cayenne mt-1">Adding…</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
