import { NextRequest, NextResponse } from 'next/server'
import { searchBooks, searchByISBN } from '@/lib/books/googleBooks'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const isbn = searchParams.get('isbn')

  if (!q && !isbn) {
    return NextResponse.json({ error: 'Provide q or isbn param' }, { status: 400 })
  }

  try {
    const books = isbn ? await searchByISBN(isbn) : await searchBooks(q!)
    return NextResponse.json({ books })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
