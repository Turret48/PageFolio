export interface BookCandidate {
  googleBooksId: string
  title: string
  author: string
  coverUrl: string | null
  description: string | null
  publishedYear: number | null
  pageCount: number | null
  categories: string[]
}

const BASE = 'https://www.googleapis.com/books/v1/volumes'

const FICTION_SIGNALS = [
  'fiction', 'novel', 'fantasy', 'romance', 'thriller',
  'mystery', 'science fiction', 'horror', 'short stories',
]

const EXCLUDED_CATEGORIES = [
  'science', 'chemistry', 'physics', 'mathematics', 'medicine',
  'medical', 'journal', 'periodical', 'juvenile', "children's",
]

const DERIVATIVE_TITLE_PATTERNS = [
  /^summary[:\s&]/i,
  /^summary of /i,
  /^analysis of /i,
  /^study guide/i,
  /^workbook/i,
  /^book summary/i,
  /^key (insights|takeaways|lessons)/i,
  /\bin \d+ minutes\b/i,
  /\bsummarized (for|by)\b/i,
  /\b(penzen|getabstract|blinkist|sapiens summaries)\b/i,
]

const DERIVATIVE_PUBLISHERS = [
  'quality summaries', 'ant hive media', 'save time summaries',
  'goldmine reads', 'book summary', 'business book summaries',
  'thronfield ashford', 'instaread', 'summary station',
]

function isNonfiction(categories: string[]): boolean {
  const lower = categories.map((c) => c.toLowerCase()).join(' ')
  if (FICTION_SIGNALS.some((s) => lower.includes(s))) return false
  if (EXCLUDED_CATEGORIES.some((s) => lower.includes(s))) return false
  return true
}

function isDerivativeWork(title: string, publisher: string): boolean {
  if (DERIVATIVE_TITLE_PATTERNS.some((p) => p.test(title))) return true
  if (DERIVATIVE_PUBLISHERS.some((p) => publisher.includes(p))) return true
  return false
}

function isUsableBook(
  candidate: BookCandidate,
  ratingsCount: number | null,
  language: string,
  publisher: string,
): boolean {
  if (language !== 'en') return false
  if (!candidate.coverUrl) return false
  if (candidate.author === 'Unknown') return false
  if (candidate.publishedYear && candidate.publishedYear < 1950) return false
  if (isDerivativeWork(candidate.title, publisher)) return false
  if (ratingsCount !== null && ratingsCount < 10) return false
  return true
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(the|a|an|and|of|in|to|by)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 35)
}

function deduplicate(books: BookCandidate[]): BookCandidate[] {
  const seen = new Set<string>()
  return books.filter((b) => {
    const key = `${b.author.toLowerCase().slice(0, 20)}|${normalizeTitle(b.title)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function toCandidate(item: Record<string, unknown>): BookCandidate {
  const info = (item.volumeInfo ?? {}) as Record<string, unknown>
  const images = (info.imageLinks ?? {}) as Record<string, string>
  const authors = (info.authors as string[] | undefined) ?? ['Unknown']
  const categories = (info.categories as string[] | undefined) ?? []

  return {
    googleBooksId: item.id as string,
    title: (info.title as string | undefined) ?? 'Unknown',
    author: authors.join(', '),
    coverUrl: images.thumbnail?.replace('http:', 'https:') ?? null,
    description: (info.description as string | undefined) ?? null,
    publishedYear: info.publishedDate
      ? parseInt(info.publishedDate as string, 10)
      : null,
    pageCount: (info.pageCount as number | undefined) ?? null,
    categories,
  }
}

export async function searchBooks(query: string): Promise<BookCandidate[]> {
  const params = new URLSearchParams({
    q: query,
    maxResults: '20',
    printType: 'books',       // books only — no journals, magazines, or articles
    langRestrict: 'en',
    key: process.env.GOOGLE_BOOKS_API_KEY!,
  })
  const res = await fetch(`${BASE}?${params}`, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error('Google Books search failed')

  const data = (await res.json()) as { items?: Record<string, unknown>[] }
  if (!data.items) return []

  const filtered = data.items.reduce<BookCandidate[]>((acc, item) => {
    const candidate = toCandidate(item)
    const info = (item.volumeInfo ?? {}) as Record<string, unknown>
    const ratingsCount = (info.ratingsCount as number | undefined) ?? null
    const language = (info.language as string | undefined) ?? ''
    const publisher = ((info.publisher as string | undefined) ?? '').toLowerCase()
    if (isNonfiction(candidate.categories) && isUsableBook(candidate, ratingsCount, language, publisher)) {
      acc.push(candidate)
    }
    return acc
  }, [])

  return deduplicate(filtered)
}

export async function searchByISBN(isbn: string): Promise<BookCandidate[]> {
  return searchBooks(`isbn:${isbn}`)
}

export async function getBookById(googleBooksId: string): Promise<BookCandidate | null> {
  const url = `${BASE}/${googleBooksId}?key=${process.env.GOOGLE_BOOKS_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) return null

  const item = (await res.json()) as Record<string, unknown>
  return toCandidate(item)
}
