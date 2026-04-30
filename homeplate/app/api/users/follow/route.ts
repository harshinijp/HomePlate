import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { target_id, action } = await req.json()

  if (action === 'follow') {
    await supabase.from('follows').insert({ follower_id: user.id, following_id: target_id })
  } else {
    await supabase.from('follows').delete().match({ follower_id: user.id, following_id: target_id })
  }

  return NextResponse.json({ success: true })
}