import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// TODO: implement in Step 12 when Reading Rooms are built
export async function POST(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({ error: 'Rooms not yet available' }, { status: 501 })
}
