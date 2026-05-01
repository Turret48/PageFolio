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

function isNonfiction(categories: string[]): boolean {
  const lower = categories.map((c) => c.toLowerCase()).join(' ')
  return !FICTION_SIGNALS.some((s) => lower.includes(s))
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
  const url = `${BASE}?q=${encodeURIComponent(query)}&maxResults=20&key=${process.env.GOOGLE_BOOKS_API_KEY}`
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error('Google Books search failed')

  const data = (await res.json()) as { items?: Record<string, unknown>[] }
  if (!data.items) return []

  return data.items
    .map(toCandidate)
    .filter((b) => isNonfiction(b.categories))
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
